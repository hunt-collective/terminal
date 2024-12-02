import { mysqlTable, unique, int, varchar } from "drizzle-orm/mysql-core";
import { cardTable } from "../card/card.sql";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";
import { productVariantTable } from "../product/product.sql";
import { userTable } from "../user/user.sql";
import { z } from "zod";
import { addressTable } from "../address/address.sql";

export const subscriptionTable = mysqlTable(
  "subscription",
  {
    ...id,
    ...timestamps,
    timeNext: timestamp("time_next"),
    userID: ulid("user_id")
      .references(() => userTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    frequency: varchar("frequency", {
      length: 255,
    })
      .$type<SubscriptionFrequency>()
      .notNull(),
    productVariantID: ulid("product_variant_id")
      .references(() => productVariantTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    quantity: int("quantity").notNull(),
    addressID: ulid("shipping_id")
      .references(() => addressTable.id)
      .notNull(),
    cardID: ulid("card_id")
      .references(() => cardTable.id)
      .notNull(),
  },
  (table) => ({
    unique: unique("unique").on(table.userID, table.productVariantID),
  }),
);

export const SubscriptionFrequency = z.enum([
  "fixed",
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);
export type SubscriptionFrequency = z.infer<typeof SubscriptionFrequency>;
