import { z } from "zod";
import { Result } from "./common";
import { Order } from "@terminal/core/order/order";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator, resolver } from "hono-openapi/zod";
import { Examples } from "@terminal/core/examples";

export module OrderApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Order"],
        summary: "List orders",
        description: "List the orders associated with the current user.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Order.Info.array().openapi({
                    description: "List of orders.",
                    example: [Examples.Order],
                  }),
                ),
              },
            },
            description: "List of orders.",
          },
        },
      }),
      async (c) => {
        const data = await Order.list();
        return c.json(
          {
            data,
          },
          200,
        );
      },
    )
    .get(
      "/:id",
      describeRoute({
        tags: ["Order"],
        summary: "Get order",
        description: "Get the order with the given ID.",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: resolver(z.object({ error: z.string() })),
              },
            },
            description: "Order not found.",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Order.Info.openapi({
                    description: "Order information.",
                    example: Examples.Order,
                  }),
                ),
              },
            },
            description: "Order information.",
          },
        },
      }),
      validator(
        "param",
        z.object({
          id: z.string().openapi({
            description: "ID of the order to get.",
            example: Examples.Order.id,
          }),
        }),
      ),
      async (c) => {
        const param = c.req.valid("param");
        const order = await Order.fromID(param.id);
        if (!order) return c.json({ error: "Order not found" }, 404);
        return c.json({ data: order }, 200);
      },
    );
}
