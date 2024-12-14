import { z } from "zod";
import { and, eq, inArray, not, sql } from "drizzle-orm";
import { useTransaction } from "../drizzle/transaction";
import { stripe } from "../stripe";
import { fn } from "../util/fn";
import { userTable } from "../user/user.sql";
import { createID } from "../util/id";
import { useUserID } from "../actor";
import { cardTable } from "./card.sql";
import { VisibleError } from "../error";
import { Common } from "../common";
import { Examples } from "../examples";

export module Card {
  export const Info = z
    .object({
      id: z.string().openapi({
        description: Common.IdDescription,
        example: Examples.Card.id,
      }),
      brand: z.string().openapi({
        description: "Brand of the card.",
        example: Examples.Card.brand,
      }),
      expiration: z
        .object({
          year: z.number().int().openapi({
            description: "Expiration year of the card.",
            example: Examples.Card.expiration.year,
          }),
          month: z.number().int().openapi({
            description: "Expiration month of the card.",
            example: Examples.Card.expiration.month,
          }),
        })
        .openapi({
          description: "Expiration of the card.",
          example: Examples.Card.expiration,
        }),
      last4: z.string().openapi({
        description: "Last four digits of the card.",
        example: Examples.Card.last4,
      }),
    })
    .openapi({
      ref: "Card",
      description: "Credit card used for payments in the Terminal shop.",
      example: Examples.Card,
    });

  export type Info = z.infer<typeof Info>;

  export function list() {
    return useTransaction(async (tx) =>
      tx
        .select()
        .from(cardTable)
        .where(eq(cardTable.userID, useUserID()))
        .execute()
        .then((rows) => rows.map(serialize)),
    );
  }

  export const create = fn(
    z.object({ token: z.string() }),
    async ({ token }) => {
      return useTransaction(async (tx) => {
        const user = await tx
          .select()
          .from(userTable)
          .where(eq(userTable.id, useUserID()))
          .limit(1)
          .then((r) => r[0]);
        if (!user) throw new Error("User not found");

        const paymentMethod = await stripe.paymentMethods
          .create({ type: "card", card: { token } })
          .catch((e) => e.message as string);
        if (typeof paymentMethod === "string") {
          console.error(paymentMethod);
          throw new VisibleError(
            "input",
            "payment.invalid",
            "Card details are invalid",
          );
        }

        const methods = await stripe.customers
          .listPaymentMethods(user.stripeCustomerID)
          .then((r) => r.data);
        const existing = methods.find(
          (m) => m.card?.fingerprint === paymentMethod.card?.fingerprint,
        );
        if (existing)
          throw new VisibleError(
            "input",
            "payment.invalid",
            "Payment method already exists",
          );

        const attached = await stripe.paymentMethods
          .attach(paymentMethod.id, { customer: user.stripeCustomerID })
          .catch((e) => e.message as string);
        if (typeof attached === "string")
          throw new VisibleError("input", "payment.invalid", attached);

        const id = createID("card");
        await tx
          .insert(cardTable)
          .values({
            id,
            userID: user.id,
            stripePaymentMethodID: paymentMethod.id,
            brand: paymentMethod.card!.brand,
            expirationMonth: paymentMethod.card!.exp_month,
            expirationYear: paymentMethod.card!.exp_year,
            last4: paymentMethod.card!.last4,
          })
          .onDuplicateKeyUpdate({
            set: {
              brand: sql`VALUES(brand)`,
              expirationMonth: sql`VALUES(expiration_month)`,
              expirationYear: sql`VALUES(expiration_year)`,
              last4: sql`VALUES(last4)`,
            },
          });
        return tx
          .select({ id: cardTable.id })
          .from(cardTable)
          .where(eq(cardTable.stripePaymentMethodID, paymentMethod.id))
          .then((r) => r[0]!.id);
      });
    },
  );

  export const remove = fn(z.string(), (input) =>
    useTransaction(async (tx) => {
      const paymentMethodID = await tx
        .select({ stripePaymentMethodID: cardTable.stripePaymentMethodID })
        .from(cardTable)
        .where(eq(cardTable.id, input))
        .then((r) => r[0]!.stripePaymentMethodID);
      if (!paymentMethodID)
        throw new VisibleError(
          "input",
          "payment.invalid",
          "Stripe payment method not found",
        );
      await stripe.paymentMethods
        .detach(paymentMethodID)
        .catch((e) => e.message as string);
      await tx
        .delete(cardTable)
        .where(and(eq(cardTable.id, input), eq(cardTable.userID, useUserID())));
    }),
  );

  export const sync = fn(z.string(), (customerID) => {
    return useTransaction(async (tx) => {
      console.log("card.sync", customerID);
      const user = await tx
        .select()
        .from(userTable)
        .where(eq(userTable.stripeCustomerID, customerID))
        .limit(1)
        .then((r) => r[0]);
      if (!user) return;
      const methods = await stripe.customers
        .listPaymentMethods(customerID)
        .then((r) => r.data);
      console.log("syncing", methods.length, "cards");
      if (methods.length) {
        await tx
          .insert(cardTable)
          .values(
            methods
              .filter((m) => m.card)
              .map((m) => ({
                id: createID("card"),
                userID: user.id,
                stripePaymentMethodID: m.id,
                brand: m.card!.brand,
                expirationMonth: m.card!.exp_month,
                expirationYear: m.card!.exp_year,
                last4: m.card!.last4,
              })),
          )
          .onDuplicateKeyUpdate({
            set: {
              brand: sql`VALUES(brand)`,
              expirationMonth: sql`VALUES(expiration_month)`,
              expirationYear: sql`VALUES(expiration_year)`,
              last4: sql`VALUES(last4)`,
            },
          });
      }
      await tx.delete(cardTable).where(
        and(
          eq(cardTable.userID, user.id),
          methods.length
            ? not(
                inArray(
                  cardTable.stripePaymentMethodID,
                  methods.map((item) => item.id),
                ),
              )
            : undefined,
        ),
      );
    });
  });

  function serialize(
    input: typeof cardTable.$inferSelect,
  ): z.infer<typeof Info> {
    return {
      id: input.id,
      brand: input.brand,
      last4: input.last4,
      expiration: {
        year: input.expirationYear,
        month: input.expirationMonth,
      },
    };
  }
}
