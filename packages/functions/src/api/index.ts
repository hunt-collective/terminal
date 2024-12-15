import "zod-openapi/extend";
import { Hono, MiddlewareHandler } from "hono";
import { logger } from "hono/logger";
import { VisibleError } from "@terminal/core/error";
import { ProductApi } from "./product";
import { UserApi } from "./user";
import { handle, streamHandle } from "hono/aws-lambda";
import { CartApi } from "./cart";
import { ActorContext } from "@terminal/core/actor";
import { CardApi } from "./card";
import { OrderApi } from "./order";
import { Hook } from "./hook";
import { Print } from "./print";
import { EmailApi } from "./email";
import { SubscriptionApi } from "./subscription";
import { createClient } from "@openauthjs/openauth/client";
import { Resource } from "sst";
import { subjects } from "../subject";
import { openAPISpecs } from "hono-openapi";
import { ZodError } from "zod";
import { Converter } from "@apiture/openapi-down-convert";
import { HTTPException } from "hono/http-exception";
import { AddressApi } from "./address";
import { Api } from "@terminal/core/api/api";

const client = createClient({
  clientID: "api",
  issuer: Resource.Auth.url,
});
const auth: MiddlewareHandler = async (c, next) => {
  const authHeader =
    c.req.query("authorization") ?? c.req.header("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match || !match[1]) {
      throw new VisibleError(
        "input",
        "auth.token",
        "Bearer token not found or improperly formatted",
      );
    }
    const bearerToken = match[1];

    if (bearerToken?.startsWith("terminal_")) {
      const token = await Api.Personal.fromToken(bearerToken);
      if (!token)
        throw new VisibleError("input", "auth.invalid", "Invalid bearer token");
      return ActorContext.with(
        {
          type: "user",
          properties: {
            userID: token.userID,
            auth: {
              type: "personal",
              token: token.id,
            },
          },
        },
        next,
      );
    }

    const result = await client.verify(subjects, bearerToken!);
    if (result.err)
      throw new VisibleError("input", "auth.invalid", "Invalid bearer token");
    if (result.subject.type === "user") {
      return ActorContext.with(
        {
          type: "user",
          properties: {
            userID: result.subject.properties.userID,
            auth: {
              type: "oauth",
              clientID: result.aud,
            },
          },
        },
        next,
      );
    }
  }

  return ActorContext.with({ type: "public", properties: {} }, next);
};

const app = new Hono();
app
  .use(logger(), async (c, next) => {
    c.header("Cache-Control", "no-store");
    return next();
  })
  .use(auth);

const routes = app
  .route("/product", ProductApi.route)
  .route("/user", UserApi.route)
  .route("/card", CardApi.route)
  .route("/address", AddressApi.route)
  .route("/cart", CartApi.route)
  .route("/order", OrderApi.route)
  .route("/hook", Hook.route)
  .route("/print", Print.route)
  .route("/email", EmailApi.route)
  .route("/subscription", SubscriptionApi.route)
  .onError((error, c) => {
    // console.error(error);
    if (error instanceof VisibleError) {
      return c.json(
        {
          code: error.code,
          message: error.message,
        },
        error.kind === "auth" ? 401 : 400,
      );
    }
    if (error instanceof ZodError) {
      const e = error.errors[0];
      if (e) {
        return c.json(
          {
            code: e?.code,
            message: e?.message,
          },
          400,
        );
      }
    }
    if (error instanceof HTTPException) {
      return c.json(
        {
          code: "request",
          message: "Invalid request",
        },
        400,
      );
    }
    return c.json(
      {
        code: "internal",
        message: "Internal server error",
      },
      500,
    );
  });

app.get(
  "/doc",
  async (c, next) => {
    await next();
    const original = c.res.clone();
    const body = await original.json();
    const converted = new Converter(body as object, {}).convert();
    c.res = undefined;
    c.res = c.json(converted);
  },
  openAPISpecs(routes, {
    documentation: {
      info: {
        title: "Terminal API",
        version: "0.1.0",
      },
      components: {
        securitySchemes: {
          Bearer: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ Bearer: [] }],
      servers: [{ url: Resource.Urls.api }],
    },
  }),
);

export type Routes = typeof routes;
export const handler = process.env.SST_LIVE ? handle(app) : streamHandle(app);
