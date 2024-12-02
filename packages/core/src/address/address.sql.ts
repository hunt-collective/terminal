import { mysqlTable } from "drizzle-orm/mysql-core";
import { id, timestamps, ulid, address } from "../drizzle/types";
import { userTable } from "../user/user.sql";

export const addressTable = mysqlTable("user_shipping", {
  ...id,
  ...timestamps,
  userID: ulid("user_id")
    .references(() => userTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  address: address("address").notNull(),
});
