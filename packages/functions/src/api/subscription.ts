import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Result } from "./common";
import { Subscription } from "@terminal/core/subscription/subscription";

export module SubscriptionApi {
  export const SubscriptionSchema = z
    .object(Subscription.Info.shape)
    .openapi("Subscription");

  export const route = new OpenAPIHono()
    .openapi(
      createRoute({
        security: [{ Bearer: [] }],
        method: "get",
        path: "/",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(SubscriptionSchema.array()),
              },
            },
            description: "Returns a list of subscriptions",
          },
        },
      }),
      async (c) => {
        const result = await Subscription.list();
        return c.json(
          {
            result,
          },
          200,
        );
      },
    )
    .openapi(
      createRoute({
        security: [{ Bearer: [] }],
        method: "put",
        path: "/",
        request: {
          body: {
            content: {
              "application/json": {
                schema: z.object({
                  productVariantID: SubscriptionSchema.shape.productVariantID,
                  quantity: SubscriptionSchema.shape.quantity,
                  frequency: SubscriptionSchema.shape.frequency,
                  shippingID: SubscriptionSchema.shape.shippingID,
                  cardID: SubscriptionSchema.shape.cardID,
                }),
              },
            },
          },
        },
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.boolean()),
              },
            },
            description: "Returns the cart",
          },
        },
      }),
      async (c) => {
        const body = c.req.valid("json");
        await Subscription.create(body);
        return c.json({ result: true }, 200);
      },
    )
    .openapi(
      createRoute({
        security: [{ Bearer: [] }],
        method: "delete",
        path: "/{id}",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.literal("ok")),
              },
            },
            description: "Subscription was cancelled successfully",
          },
        },
      }),
      async (c) => {
        await Subscription.remove(c.req.param("id"));
        return c.json({ result: "ok" as const }, 200);
      },
    );
}
