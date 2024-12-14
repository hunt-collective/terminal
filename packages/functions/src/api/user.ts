import { z } from "zod";
import { Result } from "./common";
import { User } from "@terminal/core/user/index";
import { useUserID } from "@terminal/core/actor";
import { Cart } from "@terminal/core/cart/index";
import { Product } from "@terminal/core/product/index";
import { Card } from "@terminal/core/card/index";
import { Subscription } from "@terminal/core/subscription/subscription";
import { Order } from "@terminal/core/order/order";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator, resolver } from "hono-openapi/zod";
import { Examples } from "@terminal/core/examples";
import { Address } from "@terminal/core/address/index";

export module UserApi {
  export const route = new Hono()
    .get(
      "/me",
      describeRoute({
        tags: ["User"],
        summary: "Get user",
        description: "Get the current user.",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: resolver(z.object({ error: z.string() })),
              },
            },
            description: "User not found.",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(
                  User.Info.openapi({
                    description: "User information.",
                    example: Examples.User,
                  }),
                ),
              },
            },
            description: "User information.",
          },
        },
      }),
      async (c) => {
        const data = await User.fromID(useUserID());
        if (!data) return c.json({ error: "User not found" }, 404);
        return c.json({ data }, 200);
      },
    )
    .get(
      "/init",
      describeRoute({
        tags: ["User"],
        summary: "Get app data",
        description:
          "Get initial app data, including user, products, cart, addresses, cards, subscriptions, and orders.",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: resolver(z.object({ error: z.string() })),
              },
            },
            description: "User not found",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(
                  z
                    .object({
                      user: User.Info,
                      products: Product.Info.array(),
                      cart: Cart.Info,
                      addresses: Address.Info.array(),
                      cards: Card.Info.array(),
                      subscriptions: Subscription.Info.array(),
                      orders: Order.Info.array(),
                    })
                    .openapi({
                      description: "Initial app data.",
                      examples: [
                        {
                          user: Examples.User,
                          products: [Examples.Product],
                          cart: Examples.Cart,
                          addresses: [Examples.Shipping],
                          cards: [Examples.Card],
                          subscriptions: [Examples.Subscription],
                          orders: [Examples.Order],
                        },
                      ],
                    }),
                ),
              },
            },
            description: "Initial app data.",
          },
        },
      }),
      async (c) => {
        const [user, products, cart, addresses, cards, subscriptions, orders] =
          await Promise.all([
            User.fromID(useUserID()),
            Product.list(),
            Cart.get(),
            Address.list(),
            Card.list(),
            Subscription.list(),
            Order.list(),
          ]);
        if (!user) return c.json({ error: "User not found" }, 404);
        return c.json(
          {
            data: {
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
    .put(
      "/me",
      describeRoute({
        tags: ["User"],
        summary: "Update user",
        description: "Update the current user.",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: resolver(z.object({ error: z.string() })),
              },
            },
            description: "User not found.",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(
                  User.Info.openapi({
                    description: "Updated user information.",
                    example: Examples.User,
                  }),
                ),
              },
            },
            description: "Updated user information.",
          },
        },
      }),
      validator(
        "json",
        User.update.schema.omit({ id: true }).openapi({
          description: "The user's updated information.",
          example: { name: Examples.User.name, email: Examples.User.email },
        }),
      ),
      async (c) => {
        const id = useUserID();
        await User.update({ id, ...c.req.valid("json") });
        const user = await User.fromID(id);
        if (!user) return c.json({ error: "User not found" }, 404);
        return c.json({ data: user }, 200);
      },
    );
}
