import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Result } from "./common";
import { User } from "@terminal/core/user/index";
import { useUserID } from "@terminal/core/actor";
import { CardApi } from "./card";
import { CartApi } from "./cart";
import { SubscriptionApi } from "./subscription";
import { OrderApi } from "./order";
import { ProductApi } from "./product";
import { Cart } from "@terminal/core/cart/index";
import { Product } from "@terminal/core/product/index";
import { Card } from "@terminal/core/card/index";
import { Subscription } from "@terminal/core/subscription/subscription";
import { Order } from "@terminal/core/order/order";
import { Schema } from "./schema";

export module UserApi {
  export const route = new OpenAPIHono()
    .openapi(
      createRoute({
        method: "get",
        path: "/me",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: z.object({ error: z.string() }),
              },
            },
            description: "User not found",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(Schema.UserSchema),
              },
            },
            description: "Returns user",
          },
        },
      }),
      async (c) => {
        const result = await User.fromID(useUserID());
        if (!result) {
          return c.json({ error: "User not found" }, 404);
        }
        return c.json({ result }, 200);
      },
    )
    .openapi(
      createRoute({
        method: "get",
        path: "/init",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: z.object({ error: z.string() }),
              },
            },
            description: "User not found",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(
                  z.object({
                    user: Schema.UserSchema,
                    products: ProductApi.ProductSchema.array(),
                    cart: CartApi.CartSchema,
                    addresses: Schema.UserShippingSchema.array(),
                    cards: CardApi.CardSchema.array(),
                    subscriptions: SubscriptionApi.SubscriptionSchema.array(),
                    orders: OrderApi.OrderSchema.array(),
                  }),
                ),
              },
            },
            description: "Returns initial app data",
          },
        },
      }),
      async (c) => {
        const [user, products, cart, addresses, cards, subscriptions, orders] =
          await Promise.all([
            User.fromID(useUserID()),
            Product.list(),
            Cart.get(),
            User.shipping(),
            Card.list(),
            Subscription.list(),
            Order.list(),
          ]);
        if (!user) {
          return c.json({ error: "User not found" }, 404);
        }
        return c.json(
          {
            result: {
              user,
              products,
              cart,
              addresses,
              cards,
              subscriptions,
              orders,
            },
          },
          200,
        );
      },
    )
    .openapi(
      createRoute({
        method: "put",
        path: "/me",
        request: {
          body: {
            content: {
              "application/json": {
                schema: User.update.schema,
              },
            },
          },
        },
        responses: {
          404: {
            content: {
              "application/json": {
                schema: z.object({ error: z.string() }),
              },
            },
            description: "User not found",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(Schema.UserSchema),
              },
            },
            description: "Returns user",
          },
        },
      }),
      async (c) => {
        await User.update(c.req.valid("json"));
        const user = await User.fromID(useUserID());
        if (!user) return c.json({ error: "User not found" }, 404);
        return c.json({ result: user }, 200);
      },
    )
    .openapi(
      createRoute({
        method: "get",
        path: "/shipping",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(Schema.UserShippingSchema.array()),
              },
            },
            description: "Returns shipping addresses",
          },
        },
      }),
      async (c) => {
        const result = await User.shipping();
        return c.json({ result }, 200);
      },
    )
    .openapi(
      createRoute({
        method: "post",
        path: "/shipping",
        request: {
          body: {
            content: {
              "application/json": {
                schema: User.addShipping.schema,
              },
            },
          },
        },
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(Schema.UserShippingSchema.shape.id),
              },
            },
            description: "Returns shipping address ID",
          },
        },
      }),
      async (c) => {
        const shippingID = await User.addShipping(c.req.valid("json"));
        return c.json({ result: shippingID }, 200);
      },
    )
    .openapi(
      createRoute({
        method: "delete",
        path: "/shipping/{id}",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.literal("ok")),
              },
            },
            description: "Shipping address was deleted successfully",
          },
        },
      }),
      async (c) => {
        await User.removeShipping(c.req.param("id"));
        return c.json({ result: "ok" as const }, 200);
      },
    );
}
