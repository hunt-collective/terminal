import { z } from "zod";
import { fn } from "../util/fn";
import { and, db, eq } from "../drizzle";
import { apiClientTable } from "./api.sql";
import { createID } from "../util/id";
import { useUserID } from "../actor";

export namespace Api {
  export const Client = z.object({
    id: z.string(),
    name: z.string(),
    redirectURI: z.string(),
  });

  export const create = fn(
    Client.pick({
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
    Client.pick({
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
