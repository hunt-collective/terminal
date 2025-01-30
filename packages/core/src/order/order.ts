import {
  afterTx,
  createTransaction,
  useTransaction,
} from "../drizzle/transaction";
import { createID } from "../util/id";
import { orderItemTable, orderTable } from "./order.sql";
import { assertFlag, useUserID } from "../actor";
import { userTable } from "../user/user.sql";
import {
  and,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  sql,
  sum,
  desc,
} from "drizzle-orm";
import { cartItemTable, cartTable } from "../cart/cart.sql";
import {
  productTable,
  productVariantInventoryTable,
  productVariantTable,
} from "../product/product.sql";
import { z } from "zod";
import { fn } from "../util/fn";
import { cardTable } from "../card/card.sql";
import { defineEvent } from "../event";
import { bus } from "sst/aws/bus";
import { Resource } from "sst";
import { stripe } from "../stripe";
import { Stripe } from "stripe";
import { Shippo } from "../shippo/index";
import { VisibleError } from "../error";
import { inventoryRecordTable } from "../inventory/inventory.sql";
import { pipe, groupBy, values, map } from "remeda";
import { Common } from "../common";
import { Examples } from "../examples";
import { Address } from "../address";
import { addressTable } from "../address/address.sql";
import { Product } from "../product";
import { Cart } from "../cart";
import { filter, useFilterContext } from "../product/filter";

export module Order {
  export const Item = z
    .object({
      id: z.string().openapi({
        description: Common.IdDescription,
        example: Examples.OrderItem.id,
      }),
      description: z.string().optional().openapi({
        description: "Description of the item in the order.",
      }),
      amount: z.number().int().openapi({
        description: "Amount of the item in the order, in cents (USD).",
        example: Examples.OrderItem.amount,
      }),
      quantity: z.number().int().min(0).openapi({
        description: "Quantity of the item in the order.",
        example: Examples.OrderItem.quantity,
      }),
      productVariantID: z.string().optional().openapi({
        description: "ID of the product variant of the item in the order.",
        example: Examples.OrderItem.productVariantID,
      }),
    })
    .openapi({ ref: "OrderItem", example: Examples.OrderItem });

  export const Info = z
    .object({
      id: z.string().openapi({
        description: Common.IdDescription,
        example: Examples.Order.id,
      }),
      index: z.number().int().optional().openapi({
        description: "Zero-based index of the order for this user only.",
        example: Examples.Order.index,
      }),
      shipping: Address.Inner.openapi({
        description: "Shipping address of the order.",
        example: Examples.Order.shipping,
      }),
      amount: z
        .object({
          shipping: z.number().int().openapi({
            description: "Shipping amount of the order, in cents (USD).",
            example: Examples.Order.amount.shipping,
          }),
          subtotal: z.number().int().openapi({
            description: "Subtotal amount of the order, in cents (USD).",
            example: Examples.Order.amount.subtotal,
          }),
        })
        .openapi({
          description: "The subtotal and shipping amounts of the order.",
          example: Examples.Order.amount,
        }),
      tracking: z
        .object({
          service: z.string().optional().openapi({
            description: "Shipping service of the order.",
            example: Examples.Order.tracking.service,
          }),
          number: z.string().optional().openapi({
            description: "Tracking number of the order.",
            example: Examples.Order.tracking.number,
          }),
          url: z.string().optional().openapi({
            description: "Tracking URL of the order.",
            example: Examples.Order.tracking.url,
          }),
        })
        .openapi({
          description: "Tracking information of the order.",
          example: Examples.Order.tracking,
        }),
      items: Item.array().openapi({
        description: "Items in the order.",
        example: Examples.Order.items,
      }),
    })
    .openapi({
      ref: "Order",
      description: "An order from the Terminal shop.",
      example: Examples.Order,
    });

  export type Info = z.infer<typeof Info>;

  export const Event = {
    Created: defineEvent(
      "order.created",
      z.object({
        orderID: Info.shape.id,
      }),
    ),
  };

  export const list = () =>
    useTransaction(async (tx) => {
      const rows = await tx
        .select()
        .from(orderTable)
        .innerJoin(cartTable, eq(orderTable.userID, cartTable.userID))
        .leftJoin(orderItemTable, eq(orderTable.id, orderItemTable.orderID))
        .leftJoin(
          productVariantTable,
          eq(orderItemTable.productVariantID, productVariantTable.id),
        )
        .where(eq(orderTable.userID, useUserID()))
        .orderBy(desc(orderTable.id));
      const result = pipe(
        rows,
        groupBy((x) => x.order.id),
        values(),
        map(
          (group): Info => ({
            id: group[0].order.id,
            // index: group[0].order.index,
            shipping: group[0].order.shippingAddress,
            amount: {
              shipping: group[0].order.shippingAmount,
              subtotal: group.reduce(
                (acc, row) => acc + row.order_item!.amount,
                0,
              ),
            },
            tracking: {
              service: group[0].cart.shippingService || undefined,
              number: group[0].order.trackingNumber || undefined,
              url: group[0].order.trackingURL || undefined,
            },
            items: group.map((row) => ({
              id: row.order_item!.id,
              amount: row.order_item!.amount,
              quantity: row.order_item!.quantity,
              productVariantID: row.order_item!.productVariantID!,
            })),
          }),
        ),
      );
      return result as Info[];
    });

  export const fromID = fn(Info.shape.id, (input) =>
    useTransaction((tx) =>
      tx
        .select()
        .from(orderTable)
        .innerJoin(orderItemTable, eq(orderTable.id, orderItemTable.orderID))
        .leftJoin(
          productVariantTable,
          eq(orderItemTable.productVariantID, productVariantTable.id),
        )
        .where(eq(orderTable.id, input))
        .then(
          (rows): Info => ({
            id: rows[0]!.order.id,
            shipping: rows[0]!.order.shippingAddress,
            amount: {
              shipping: rows[0]!.order.shippingAmount,
              subtotal: rows.reduce(
                (acc, row) => acc + row.order_item.amount,
                0,
              ),
            },
            tracking: {
              number: rows[0]!.order.trackingNumber || undefined,
              url: rows[0]!.order.trackingURL || undefined,
            },
            items: rows.map((row) => ({
              id: row.order_item.id,
              amount: row.order_item.amount,
              quantity: row.order_item.quantity,
              productVariantID: row.product_variant?.id,
            })),
          }),
        ),
    ),
  );

  export async function convertCart() {
    const userID = useUserID();
    const { items, cart } = await useTransaction(async (tx) => {
      const items = await tx
        .select({
          productVariantID: cartItemTable.productVariantID,
          filters: productTable.filters,
          quantity: cartItemTable.quantity,
          subtotal: sql`(${cartItemTable.quantity} * ${productVariantTable.price})`,
        })
        .from(cartItemTable)
        .innerJoin(
          productVariantTable,
          eq(cartItemTable.productVariantID, productVariantTable.id),
        )
        .innerJoin(
          productTable,
          eq(productVariantTable.productID, productTable.id),
        )
        .where(eq(cartItemTable.userID, userID))
        .then((rows) =>
          rows.map((row) => ({
            ...row,
            subtotal: z.coerce.number().int().parse(row.subtotal),
          })),
        );

      const cart = await tx
        .select({
          shipping: addressTable.address,
          card: getTableColumns(cardTable),
          stripeCustomerID: userTable.stripeCustomerID,
          email: userTable.email,
          shippingAmount: cartTable.shippingAmount,
          shippoRateID: cartTable.shippoRateID,
        })
        .from(cartTable)
        .innerJoin(addressTable, eq(cartTable.addressID, addressTable.id))
        .innerJoin(cardTable, eq(cartTable.cardID, cardTable.id))
        .innerJoin(userTable, eq(cartTable.userID, userTable.id))
        .where(eq(cartTable.userID, userID))
        .then((rows) => rows[0]);
      return { items, cart };
    });
    if (!cart) throw new Error("No cart found");
    const filterCtx = {
      ...useFilterContext(),
      region: undefined,
      country: cart.shipping.country,
    };
    for (const item of items) {
      if (!filter(filterCtx, item.filters))
        throw new Error("This product cannot be purchased.");
    }
    const orderID = createID("order");
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const shipping = cart.shippingAmount;
    if (shipping === null) throw new Error("Shipping amount not set");
    try {
      const payment = [
        "usr_01J1JGH7NH2HZ6DGAGT8SK2KE3",
        "usr_01J1KHKPA8QK82MBHQDBQP78XK",
        "usr_01J1KHPJ88QEFEQ6K27QA9C4WN",
        "usr_01JG4BDDCKTY6CYWF6JXKVPNNT",
      ].includes(userID)
        ? undefined
        : await stripe.paymentIntents.create({
            amount: subtotal + shipping,
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: "never",
            },
            confirm: true,
            currency: "usd",
            shipping: {
              name: cart.shipping.name,
              address: {
                city: cart.shipping.city,
                line1: cart.shipping.street1,
                line2: cart.shipping.street2,
                postal_code: cart.shipping.zip,
                state: cart.shipping.province,
                country: cart.shipping.country,
              },
            },
            customer: cart.stripeCustomerID,
            metadata: {
              orderID,
            },
            payment_method: cart.card.stripePaymentMethodID,
          });
      return createTransaction(async (tx) => {
        await tx.insert(orderTable).values({
          id: orderID,
          userID,
          email: cart.email,
          stripePaymentIntentID: payment?.id,
          shippingAddress: cart.shipping,
          shippingAmount: shipping,
          shippoRateID: cart.shippoRateID,
          card: {
            brand: cart.card.brand,
            last4: cart.card.last4,
            expiration: {
              month: cart.card.expirationMonth,
              year: cart.card.expirationYear,
            },
          },
        });
        await tx.insert(orderItemTable).values(
          items.map((item) => ({
            id: createID("cartItem"),
            amount: item.subtotal,
            orderID: orderID,
            productVariantID: item.productVariantID,
            quantity: item.quantity,
          })),
        );
        await tx.delete(cartItemTable).where(eq(cartItemTable.userID, userID));
        await afterTx(() =>
          bus.publish(Resource.Bus, Event.Created, { orderID }),
        );
        return orderID;
      });
    } catch (ex: unknown) {
      if (ex instanceof Stripe.errors.StripeCardError) {
        throw new VisibleError("input", "payment.invalid", ex.message);
      }
      throw ex;
    }
  }

  export const create = fn(
    z.object({
      variants: z.record(z.number().int()),
      cardID: z.string(),
      addressID: z.string(),
    }),
    async (input) => {
      const userID = useUserID();
      const match = await useTransaction(async (tx) =>
        tx
          .select({
            shipping: addressTable.address,
            card: getTableColumns(cardTable),
            stripeCustomerID: userTable.stripeCustomerID,
            email: userTable.email,
          })
          .from(userTable)
          .innerJoin(addressTable, eq(cartTable.addressID, addressTable.id))
          .innerJoin(cardTable, eq(cartTable.cardID, cardTable.id))
          .where(eq(cartTable.userID, userID))
          .then((rows) => rows[0]),
      );
      if (!match) throw new Error("Card or address not found");
      const items = await useTransaction(async (tx) =>
        tx
          .select({
            filters: productTable.filters,
            id: productVariantTable.id,
            price: productVariantTable.price,
          })
          .from(productVariantTable)
          .where(inArray(productVariantTable.id, Object.keys(input.variants)))
          .innerJoin(
            productTable,
            eq(productVariantTable.productID, productTable.id),
          )
          .then((rows) =>
            rows.map((row) => ({
              id: row.id,
              filters: row.filters,
              price: row.price * (input.variants[row.id] ?? 0),
              quantity: input.variants[row.id] ?? 0,
              weight:
                Product.TEMPORARY_FIXED_WEIGHT_OZ *
                (input.variants[row.id] ?? 0),
            })),
          ),
      );

      const filterCtx = {
        ...useFilterContext(),
        region: undefined,
        country: match.shipping.country,
      };
      for (const item of items) {
        if (!filter(filterCtx, item.filters))
          throw new Error("This product cannot be purchased.");
      }

      const subtotal = items.reduce((acc, item) => acc + item.price, 0);
      const weight = items.reduce((acc, item) => acc + item.weight, 0);
      const shipping = await Cart.calculateShipping(
        subtotal,
        weight,
        match.shipping,
      );
      const orderID = createID("order");
      const result = await stripe.paymentIntents
        .create({
          amount: subtotal + shipping.shippingAmount,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
          confirm: true,
          currency: "usd",
          shipping: {
            name: match.shipping.name,
            address: {
              city: match.shipping.city,
              line1: match.shipping.street1,
              line2: match.shipping.street2,
              postal_code: match.shipping.zip,
              state: match.shipping.province,
              country: match.shipping.country,
            },
          },
          customer: match.stripeCustomerID,
          metadata: {
            orderID,
          },
          payment_method: match.card.stripePaymentMethodID,
        })
        .catch((ex) => ({ err: ex }));

      if ("err" in result) {
        if (result.err instanceof Stripe.errors.StripeCardError)
          throw new VisibleError(
            "input",
            "payment.invalid",
            result.err.message,
          );
        throw new Error("Payment failed");
      }

      await useTransaction(async (tx) => {
        await tx.insert(orderTable).values({
          id: orderID,
          email: match.email,
          shippingAmount: shipping.shippingAmount,
          shippingAddress: match.shipping,
          shippoRateID: shipping.shippoRateID,
          card: {
            brand: match.card.brand,
            last4: match.card.last4,
            expiration: {
              month: match.card.expirationMonth,
              year: match.card.expirationYear,
            },
          },
          userID,
        });
        for (const item of items) {
          await tx.insert(orderItemTable).values({
            id: createID("cartItem"),
            amount: item.price,
            productVariantID: item.id,
            quantity: item.weight,
            orderID,
          });
        }
        await afterTx(() =>
          bus.publish(Resource.Bus, Event.Created, { orderID }),
        );
      });

      return orderID;
    },
  );

  export const createInternal = fn(
    z.object({
      email: z.string().email(),
      items: z.record(z.number().int()),
      address: Address.Inner,
    }),
    async (input) => {
      await Shippo.assertValidAddress(input.address);
      const shippingInfo = await Shippo.createShipmentRate({
        ounces: 0,
        address: input.address,
        subtotal: 0,
      });
      await useTransaction(async (tx) => {
        const orderID = createID("order");
        await tx.insert(orderTable).values({
          id: orderID,
          email: input.email,
          shippingAmount: 0,
          shippingAddress: input.address,
          shippoRateID: shippingInfo.shippoRateID,
        });
        for (const [productVariantID, quantity] of Object.entries(
          input.items,
        )) {
          if (quantity < 1) throw new Error("Invalid quantity");
          await tx.insert(orderItemTable).values({
            id: createID("cartItem"),
            amount: 0,
            productVariantID,
            quantity,
            orderID,
          });
        }
        await afterTx(() =>
          bus.publish(Resource.Bus, Event.Created, { orderID }),
        );
      });
    },
  );

  export const setPrinted = fn(Info.shape.id, async (input) => {
    assertFlag("printer");
    await useTransaction(async (tx) =>
      tx
        .update(orderTable)
        .set({
          timePrinted: sql`CURRENT_TIMESTAMP(3)`,
        })
        .where(eq(orderTable.id, input)),
    );
  });

  export async function getNextLabel() {
    await assertFlag("printer");
    const result = await useTransaction((tx) =>
      tx
        .select({
          id: orderTable.id,
          label: orderTable.labelURL,
        })
        .from(orderTable)
        .where(
          and(isNull(orderTable.timePrinted), isNotNull(orderTable.labelURL)),
        )
        .orderBy(orderTable.id)
        .limit(1)
        .then((rows) => rows[0]),
    );
    if (!result) return;
    return result;
  }

  export async function trackInventory() {
    await createTransaction(async (tx) => {
      const items = await tx
        .select({
          quantity: sum(orderItemTable.quantity).mapWith(parseInt),
          inventoryID: productVariantInventoryTable.inventoryID,
        })
        .from(orderItemTable)
        .innerJoin(orderTable, eq(orderItemTable.orderID, orderTable.id))
        .innerJoin(
          productVariantInventoryTable,
          eq(
            orderItemTable.productVariantID,
            productVariantInventoryTable.productVariantID,
          ),
        )
        .where(
          and(
            isNull(orderItemTable.timeInventoryTracked),
            isNotNull(orderTable.timePrinted),
          ),
        )
        .groupBy(productVariantInventoryTable.inventoryID);
      if (items.length === 0) {
        console.log("No inventory to track");
        return;
      }
      await tx.insert(inventoryRecordTable).values(
        items.map((item) => ({
          quantity: item.quantity * -1,
          inventoryID: item.inventoryID,
          id: createID("inventoryRecord"),
          notes: "automated",
        })),
      );

      const updated = await tx
        .select({
          id: orderItemTable.id,
        })
        .from(orderTable)
        .innerJoin(orderItemTable, eq(orderItemTable.orderID, orderTable.id))
        .where(
          and(
            isNull(orderItemTable.timeInventoryTracked),
            isNotNull(orderTable.timePrinted),
          ),
        );
      const result = await tx
        .update(orderItemTable)
        .set({
          timeInventoryTracked: sql`CURRENT_TIMESTAMP(3)`,
        })
        .where(
          inArray(
            orderItemTable.id,
            updated.map((row) => row.id),
          ),
        );
      console.log("Tracked inventory", result.rowsAffected);
    }, "repeatable read");
  }
}
