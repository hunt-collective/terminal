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
import { Examples } from "@terminal/core/examples";
import { Address } from "@terminal/core/address/index";
import { ProfileApi } from "./profile";

export module ViewApi {
  export const route = new Hono().get(
    "/init",
    describeRoute({
      tags: ["Miscellaneous"],
      summary: "Get app data",
      description:
        "Get initial app data, including user, products, cart, addresses, cards, subscriptions, and orders.",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: Result(
                z
                  .object({
                    profile: ProfileApi.Profile,
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
                        profile: Examples.Profile,
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
      return c.json(
        {
          data: {
            profile: { user },
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
  );
}
