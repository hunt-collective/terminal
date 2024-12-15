import { z } from "zod";
import { fn } from "../util/fn";
import { and, db, eq, isNull } from "../drizzle";
import { apiClientTable, apiPersonalTokenTable } from "./api.sql";
import { createID } from "../util/id";
import { useUserID } from "../actor";
import { randomBytes } from "crypto";
import { Resource } from "sst";

export namespace Api {
  export namespace Client {
    export const Info = z.object({
      id: z.string(),
      name: z.string(),
      redirectURI: z.string(),
    });

    export const create = fn(
      Info.pick({
        name: true,
        redirectURI: true,
      }),
      async (input) => {
        const id = createID("apiClient");
        const secret = createID("apiSecret");
        await db.insert(apiClientTable).values({
          id,
          secret,
          name: input.name,
          redirectURI: input.redirectURI,
          userID: useUserID(),
        });
        return {
          id,
          secret,
        };
      },
    );

    export const verifyRedirect = fn(
      Info.pick({
        id: true,
        redirectURI: true,
      }),
      async (input) => {
        const match = await db
          .select({ id: apiClientTable.id })
          .from(apiClientTable)
          .where(
            and(
              eq(apiClientTable.id, input.id),
              eq(apiClientTable.redirectURI, input.redirectURI),
            ),
          );
        return match.length === 1;
      },
    );
  }

  export namespace Personal {
    export const Info = z.object({
      id: z.string(),
      time: z.object({
        created: z.date(),
      }),
    });

    export type Info = z.infer<typeof Info>;

    export async function create() {
      const id = createID("apiPersonal");
      const prefix = Resource.App.stage === "production" ? "live" : "test";
      const token = `terminal_${prefix}_` + randomBytes(16).toString("hex");
      await db.insert(apiPersonalTokenTable).values({
        id,
        token,
        userID: useUserID(),
      });

      return {
        id,
        token,
      };
    }

    export const remove = fn(
      Info.shape.id,
      async (input) =>
        await db
          .delete(apiPersonalTokenTable)
          .where(
            and(
              eq(apiPersonalTokenTable.id, input),
              eq(apiPersonalTokenTable.userID, useUserID()),
            ),
          ),
    );

    export async function list(): Promise<Info[]> {
      return db
        .select()
        .from(apiPersonalTokenTable)
        .where(
          and(
            eq(apiPersonalTokenTable.userID, useUserID()),
            isNull(apiPersonalTokenTable.timeDeleted),
          ),
        )
        .then((rows) => rows.map(serialize));
    }

    function serialize(
      input: typeof apiPersonalTokenTable.$inferSelect,
    ): z.infer<typeof Info> {
      return {
        id: input.id,
        time: {
          created: input.timeCreated,
        },
      };
    }

    export async function fromToken(token: string) {
      return db
        .select({
          id: apiPersonalTokenTable.id,
          userID: apiPersonalTokenTable.userID,
        })
        .from(apiPersonalTokenTable)
        .where(eq(apiPersonalTokenTable.token, token))
        .then((rows) => rows.at(0));
    }
  }
}
