import { z } from "zod";
import { Result } from "./common";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator, resolver } from "hono-openapi/zod";
import { Examples } from "@terminal/core/examples";
import { Api } from "@terminal/core/api/api";

export module TokenApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Token"],
        summary: "List tokens",
        description: "List the current user's personal access tokens.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Api.Personal.Info.array().openapi({
                    description: "List of personal access tokens.",
                    example: [Examples.Token],
                  }),
                ),
              },
            },
            description: "List of personal access tokens.",
          },
        },
      }),
      async (c) => {
        const tokens = await Api.Personal.list();
        return c.json({ data: tokens }, 200);
      },
    )
    .get(
      "/:id",
      describeRoute({
        tags: ["Token"],
        summary: "Get token",
        description: "Get the personal access token with the given ID.",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: resolver(z.object({ error: z.string() })),
              },
            },
            description: "Personal token not found.",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Api.Personal.Info.openapi({
                    description: "Personal access token.",
                    example: Examples.Token,
                  }),
                ),
              },
            },
            description: "Personal access token.",
          },
        },
      }),
      validator(
        "param",
        z.object({
          id: z.string().openapi({
            description: "ID of the personal token to get.",
            example: Examples.Token.id,
          }),
        }),
      ),
      async (c) => {
        const param = c.req.valid("param");
        const token = await Api.Personal.fromID(param.id);
        if (!token) return c.json({ error: "Personal token not found." }, 404);
        return c.json({ data: token }, 200);
      },
    )
    .post(
      "/",
      describeRoute({
        tags: ["Token"],
        summary: "Create token",
        description: "Create a personal access token.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(
                  z.object({
                    id: Api.Personal.Info.shape.id.openapi({
                      description: "Personal token ID.",
                      example: Examples.Token.id,
                    }),
                    token: Api.Personal.Info.shape.token.openapi({
                      description:
                        "Personal access token. Include this in the Authorization header (`Bearer <token>`) when accessing the Terminal API.",
                      example: Examples.Token.token,
                    }),
                  }),
                ),
              },
            },
            description: "Personal access token ID and value.",
          },
        },
      }),
      async (c) => {
        const token = await Api.Personal.create();
        return c.json({ data: token }, 200);
      },
    )
    .delete(
      "/:id",
      describeRoute({
        tags: ["Token"],
        summary: "Delete token",
        description: "Delete the personal access token with the given ID.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.literal("ok")),
              },
            },
            description: "Personal access token was deleted successfully.",
          },
        },
      }),
      validator(
        "param",
        z.object({
          id: Api.Personal.Info.shape.id.openapi({
            description: "ID of the personal token to delete.",
            example: Examples.Token.id,
          }),
        }),
      ),
      async (c) => {
        const param = c.req.valid("param");
        await Api.Personal.remove(param.id);
        return c.json({ data: "ok" as const }, 200);
      },
    );
}
