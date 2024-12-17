import { z } from "zod";
import { Result } from "./common";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator, resolver } from "hono-openapi/zod";
import { Examples } from "@terminal/core/examples";
import { Api } from "@terminal/core/api/api";

export module AppApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["App (OAuth)"],
        summary: "List apps",
        description: "List the current user's registered apps.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Api.Client.Info.array().openapi({
                    description: "List of apps.",
                    example: [Examples.App],
                  }),
                ),
              },
            },
            description: "List of apps.",
          },
        },
      }),
      async (c) => {
        const apps = await Api.Client.list();
        return c.json({ data: apps }, 200);
      },
    )
    .get(
      "/:id",
      describeRoute({
        tags: ["App (OAuth)"],
        summary: "Get app",
        description: "Get the app with the given ID.",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: resolver(z.object({ error: z.string() })),
              },
            },
            description: "App not found.",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Api.Client.Info.openapi({
                    description: "App.",
                    example: Examples.App,
                  }),
                ),
              },
            },
            description: "App.",
          },
        },
      }),
      validator(
        "param",
        z.object({
          id: z.string().openapi({
            description: "ID of the app to get.",
            example: Examples.App.id,
          }),
        }),
      ),
      async (c) => {
        const param = c.req.valid("param");
        const app = await Api.Client.fromID(param.id);
        if (!app) return c.json({ error: "App not found." }, 404);
        return c.json({ data: app }, 200);
      },
    )
    .post(
      "/",
      describeRoute({
        tags: ["App (OAuth)"],
        summary: "Create app",
        description: "Create an app.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(
                  z.object({
                    id: Api.Client.Info.shape.id.openapi({
                      description: "OAuth 2.0 client ID.",
                      example: Examples.App.id,
                    }),
                    secret: z.string().openapi({
                      description: "OAuth 2.0 client secret.",
                      example: Examples.App.secret,
                    }),
                  }),
                ),
              },
            },
            description: "OAuth 2.0 client ID and secret.",
          },
        },
      }),
      validator(
        "json",
        Api.Client.create.schema.openapi({
          description: "Basic app information.",
          example: {
            name: Examples.App.name,
            redirectURI: Examples.App.redirectURI,
          },
        }),
      ),
      async (c) => {
        const app = await Api.Client.create(c.req.valid("json"));
        return c.json({ data: app }, 200);
      },
    )
    .delete(
      "/:id",
      describeRoute({
        tags: ["App (OAuth)"],
        summary: "Delete app",
        description: "Delete the app with the given ID.",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: Result(z.literal("ok")),
              },
            },
            description: "App was deleted successfully.",
          },
        },
      }),
      validator(
        "param",
        z.object({
          id: Api.Client.Info.shape.id.openapi({
            description: "ID of the app to delete.",
            example: Examples.App.id,
          }),
        }),
      ),
      async (c) => {
        const param = c.req.valid("param");
        await Api.Client.remove(param.id);
        return c.json({ data: "ok" as const }, 200);
      },
    );
}
