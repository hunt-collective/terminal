import { z } from "zod";
import { Result } from "./common";
import { Cart } from "@terminal/core/cart/index";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { Hono } from "hono";
import { Card } from "@terminal/core/card/index";
import { Examples } from "@terminal/core/examples";
import { Address } from "@terminal/core/address/index";

export module CartApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Cart"],
        summary: "Get cart",
        description: "Get the current user's cart.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Cart.Info.openapi({
                    description: "The current user's cart.",
                    example: Examples.Cart,
                  }),
                ),
              },
            },
            description: "The current user's cart.",
          },
        },
      }),
      async (c) => {
        return c.json(
          {
            data: await Cart.get(),
          },
          200,
        );
      },
    )
    .put(
      "/item",
      describeRoute({
        tags: ["Cart"],
        summary: "Add item",
        description: "Add an item to the current user's cart.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Cart.Info.openapi({
                    description: "The updated cart.",
                    example: Examples.Cart,
                  }),
                ),
              },
            },
            description: "The updated cart.",
          },
        },
      }),
      validator(
        "json",
        z.object({
          productVariantID: Cart.Item.shape.productVariantID.openapi({
            description: "ID of the product variant to add to the cart.",
            example: Examples.CartItem.productVariantID,
          }),
          quantity: Cart.Item.shape.quantity.openapi({
            description: "Quantity of the item to add to the cart.",
            example: Examples.CartItem.quantity,
          }),
        }),
      ),
      async (c) => {
        const body = c.req.valid("json");
        await Cart.setItem(body);
        return c.json({ data: await Cart.get() }, 200);
      },
    )
    .put(
      "/address",
      describeRoute({
        tags: ["Cart"],
        summary: "Set address",
        description: "Set the shipping address for the current user's cart.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.literal("ok")),
              },
            },
            description: "Address was set successfully.",
          },
        },
      }),
      validator(
        "json",
        z.object({
          addressID: Address.Info.shape.id.openapi({
            description:
              "ID of the shipping address to set for the current user's cart.",
            example: Examples.Shipping.id,
          }),
        }),
      ),
      async (c) => {
        const body = c.req.valid("json");
        await Cart.setAddress(body.addressID);
        return c.json({ data: "ok" as const }, 200);
      },
    )
    .put(
      "/card",
      describeRoute({
        tags: ["Cart"],
        summary: "Set card",
        description: "Set the credit card for the current user's cart.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.literal("ok")),
              },
            },
            description: "Card was set successfully.",
          },
        },
      }),
      validator(
        "json",
        z.object({
          cardID: Card.Info.shape.id.openapi({
            description:
              "ID of the credit card to set for the current user's cart.",
            example: Examples.Card.id,
          }),
        }),
      ),
      async (c) => {
        const body = c.req.valid("json");
        await Cart.setCard(body.cardID);
        return c.json({ data: "ok" as const }, 200);
      },
    );
}
