import { z } from "zod";
import "zod-openapi/extend";
import { Result } from "./common";
import { Card } from "@terminal/core/card/index";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";

export module CardApi {
  export const CardSchema = z.object(Card.Info.shape).openapi({ ref: "Card" });
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        description: "Returns a list of cards",
        responses: {
          200: {
            description: "Returns a list of cards",
            content: {
              "application/json": {
                schema: Result(CardSchema.array()),
              },
            },
          },
        },
      }),
      async (c) => {
        return c.json(
          {
            result: await Card.list(),
          },
          200,
        );
      },
    )
    .post(
      "/",
      describeRoute({
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.string()),
              },
            },
            description: "Returns card ID",
          },
        },
      }),
      validator("json", z.object({ token: z.string() })),
      async (c) => {
        const result = await Card.create(c.req.valid("json"));
        return c.json({ result }, 200);
      },
    )
    .delete(
      "/{id}",
      describeRoute({
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.literal("ok")),
              },
            },
            description: "Card was deleted successfully",
          },
        },
      }),
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        const param = c.req.valid("param");
        await Card.remove(param.id);
        return c.json({ result: "ok" as const }, 200);
      },
    );
}
