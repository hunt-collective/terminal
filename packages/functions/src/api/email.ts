import { z } from "zod";
import { Result } from "./common";
import { EmailOctopus } from "@terminal/core/email-octopus";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator, resolver } from "hono-openapi/zod";
import { Examples } from "@terminal/core/examples";

export module EmailApi {
  export const route = new Hono().post(
    "/",
    describeRoute({
      tags: ["Miscellaneous"],
      summary: "Subscribe email",
      description: "Subscribe to email updates from Terminal.",
      security: [],
      responses: {
        400: {
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
          description: "Error response.",
        },
        200: {
          content: {
            "application/json": {
              schema: Result(z.literal("ok")),
            },
          },
          description: "Email subscription was created.",
        },
      },
    }),
    validator(
      "json",
      z.object({
        email: z.string().email().min(1).openapi({
          description: "Email address to subscribe to Terminal updates with.",
          example: Examples.User.email,
        }),
      }),
    ),
    async (c) => {
      const body = c.req.valid("json");
      if (!body.email) return c.json({ error: "Email is required" }, 400);
      await EmailOctopus.subscribe({ email: body.email });
      return c.json({ data: "ok" as const }, 200);
    },
  );
}
