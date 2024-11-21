import { Layout, Page, io } from "@interval/sdk";
import { useTransaction } from "@terminal/core/drizzle/transaction";
import {
  and,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  like,
  or,
  sql,
} from "@terminal/core/drizzle/index";
import { subscriptionTable } from "@terminal/core/subscription/subscription.sql";
import {
  productTable,
  productVariantTable,
} from "@terminal/core/product/product.sql";
import { userShippingTable, userTable } from "@terminal/core/user/user.sql";

export const Subs = new Page({
  name: "Subs",
  handler: async () => {
    const totals = await useTransaction((tx) =>
      tx
        .select({ count: count(subscriptionTable.id) })
        .from(subscriptionTable)
        .where(and(isNull(subscriptionTable.timeDeleted))),
    );

    return new Layout({
      title: "Subscription",
      menuItems: [],
      children: [
        io.display.heading(
          "Active Subscriptions: " + totals[0]?.count?.toString() ?? "0",
          {
            level: 3,
          },
        ),
        io.display.table("Subscriptions", {
          getData: async (input) => {
            return useTransaction(async (tx) => ({
              data: await tx
                .select({
                  id: subscriptionTable.id,
                  name: userTable.name,
                  email: userTable.email,
                  address: userShippingTable.address,
                  created: subscriptionTable.timeCreated,
                  next: subscriptionTable.timeNext,
                })
                .from(subscriptionTable)
                .innerJoin(
                  userTable,
                  eq(subscriptionTable.userID, userTable.id),
                )
                .innerJoin(
                  userShippingTable,
                  eq(subscriptionTable.shippingID, userShippingTable.id),
                )
                .orderBy(desc(subscriptionTable.id))
                .offset(input.offset)
                .limit(input.pageSize),
            }));
          },
          rowMenuItems: (row) =>
            [
              // row.label && {
              //   label: "Label",
              //   url: row.label!,
              // },
              // row.tracking && {
              //   label: "Tracking",
              //   url: row.tracking!,
              // },
            ].filter(Boolean) as any,
          columns: [
            "id",
            "name",
            "email",
            {
              label: "address",
              renderCell: (row) => ({
                label:
                  row.address!.city +
                  ", " +
                  row.address!.province +
                  ", " +
                  row.address!.country,
              }),
            },
            "created",
            "next",
          ],
          isSortable: false,
        }),
      ],
    });
  },
  routes: {},
});
