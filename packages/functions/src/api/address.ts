import { z } from "zod";
import { Result } from "./common";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { Examples } from "@terminal/core/examples";
import { Address } from "@terminal/core/address/index";

export module AddressApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Addresses"],
        summary: "Get addresses",
        description:
          "Get the shipping addresses associated with the current user.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Address.Info.array().openapi({
                    description: "Shipping addresses.",
                    example: [Examples.Shipping],
                  }),
                ),
              },
            },
            description: "Shipping addresses.",
          },
        },
      }),
      async (c) => {
        const data = await Address.list();
        return c.json({ data }, 200);
      },
    )
    .post(
      "/",
      describeRoute({
        tags: ["Addresses"],
        summary: "Create address",
        description: "Create and add a shipping address to the current user.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Address.Info.shape.id.openapi({
                    description: "Shipping address ID.",
                    example: Examples.Shipping.id,
                  }),
                ),
              },
            },
            description: "Shipping address ID.",
          },
        },
      }),
      validator(
        "json",
        Address.Inner.openapi({
          description: "Address information.",
          example: Examples.Address,
        }),
      ),
      async (c) => {
        const addressID = await Address.create(c.req.valid("json"));
        return c.json({ data: addressID }, 200);
      },
    )
    .delete(
      "/:id",
      describeRoute({
        tags: ["Addresses"],
        summary: "Delete address",
        description: "Delete a shipping address from the current user.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.literal("ok")),
              },
            },
            description: "Shipping address was deleted successfully.",
          },
        },
      }),
      validator(
        "param",
        z.object({
          id: Address.Info.shape.id.openapi({
            description: "ID of the shipping address to delete.",
            example: Examples.Shipping.id,
          }),
        }),
      ),
      async (c) => {
        const param = c.req.valid("param");
        await Address.remove(param.id);
        return c.json({ data: "ok" as const }, 200);
      },
    );
}
