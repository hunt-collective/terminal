import { z } from "zod";
import { Result } from "./common";
import { Subscription } from "@terminal/core/subscription/subscription";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { Examples } from "@terminal/core/examples";

export module SubscriptionApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Subscriptions"],
        summary: "List subscriptions",
        description: "List the subscriptions associated with the current user.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Subscription.Info.array().openapi({
                    description: "List of subscriptions.",
                    example: [Examples.Subscription],
                  }),
                ),
              },
            },
            description: "List of subscriptions.",
          },
        },
      }),
      async (c) => {
        const data = await Subscription.list();
        return c.json(
          {
            data,
          },
          200,
        );
      },
    )
    .put(
      "/",
      describeRoute({
        tags: ["Subscriptions"],
        summary: "Subscribe",
        description: "Create a subscription for the current user.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.literal("ok")),
              },
            },
            description: "Subscription was created successfully.",
          },
        },
      }),
      validator(
        "json",
        Subscription.Info.omit({ id: true }).openapi({
          description: "Subscription information.",
          // @ts-ignore
          example: { ...Examples.Subscription, id: undefined },
        }),
      ),
      async (c) => {
        const body = c.req.valid("json");
        await Subscription.create(body);
        return c.json({ data: "ok" as const }, 200);
      },
    )
    .delete(
      "/:id",
      describeRoute({
        tags: ["Subscriptions"],
        summary: "Cancel",
        description: "Cancel a subscription for the current user.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.literal("ok")),
              },
            },
            description: "Subscription was cancelled successfully.",
          },
        },
      }),
      validator(
        "param",
        z.object({
          id: Subscription.Info.shape.id.openapi({
            description: "ID of the subscription to cancel.",
            example: Examples.Subscription.id,
          }),
        }),
      ),
      async (c) => {
        const param = c.req.valid("param");
        await Subscription.remove(param.id);
        return c.json({ data: "ok" as const }, 200);
      },
    );
}
