import { z } from "zod";
import { Result } from "./common";
import { User } from "@terminal/core/user/index";
import { useUserID } from "@terminal/core/actor";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator, resolver } from "hono-openapi/zod";
import { Examples } from "@terminal/core/examples";

export module ProfileApi {
  export const Profile = z
    .object({
      user: User.Info,
    })
    .openapi({
      ref: "Profile",
      description: "A Terminal shop user's profile. (We have users, btw.)",
      example: Examples.Profile,
    });
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Profile"],
        summary: "Get profile",
        description: "Get the current user's profile.",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: resolver(z.object({ error: z.string() })),
              },
            },
            description: "User profile not found.",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Profile.openapi({
                    description: "User profile information.",
                    example: Examples.Profile,
                  }),
                ),
              },
            },
            description: "User profile information.",
          },
        },
      }),
      async (c) => {
        const user = await User.fromID(useUserID());
        if (!user) return c.json({ error: "User profile not found." }, 404);
        return c.json({ data: { user } }, 200);
      },
    )
    .put(
      "/",
      describeRoute({
        tags: ["Profile"],
        summary: "Update profile",
        description: "Update the current user's profile.",
        responses: {
          404: {
            content: {
              "application/json": {
                schema: resolver(z.object({ error: z.string() })),
              },
            },
            description: "User profile not found.",
          },
          200: {
            content: {
              "application/json": {
                schema: Result(
                  Profile.openapi({
                    description: "Updated user profile information.",
                    example: Examples.Profile,
                  }),
                ),
              },
            },
            description: "Updated user profile information.",
          },
        },
      }),
      validator(
        "json",
        User.update.schema.omit({ id: true }).openapi({
          description: "The user's updated profile information.",
          example: { name: Examples.User.name, email: Examples.User.email },
        }),
      ),
      async (c) => {
        const id = useUserID();
        await User.update({ id, ...c.req.valid("json") });
        const user = await User.fromID(id);
        if (!user) return c.json({ error: "User profile not found" }, 404);
        return c.json({ data: user }, 200);
      },
    );
}
