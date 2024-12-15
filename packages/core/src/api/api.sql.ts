import { mysqlTable, varchar, mysqlEnum } from "drizzle-orm/mysql-core";
import { id, timestamps, ulid } from "../drizzle/types";
import { userTable } from "../user/user.sql";

export const apiClientTable = mysqlTable("api_client", {
  ...id,
  ...timestamps,
  name: varchar("name", { length: 255 }).notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  redirectURI: varchar("redirect", { length: 255 }).notNull(),
  userID: ulid("user_id")
    .references(() => userTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
});

export const apiPersonalTokenTable = mysqlTable("api_personal_token", {
  ...id,
  ...timestamps,
  token: varchar("token", { length: 255 }).notNull(),
  userID: ulid("user_id")
    .references(() => userTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
});
