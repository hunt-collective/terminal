import { Layout, Page, io } from "@forgeapp/sdk";
// import { count, desc, sql } from "@terminal/core/drizzle/index";
import { useTransaction } from "@terminal/core/drizzle/transaction";
import { userTable } from "@terminal/core/user/user.sql";

export const User = new Page({
  name: "User",
  handler: async (c) => {
    // const domains = await useTransaction(async (tx) => ({
    //   data: await tx
    //     .select({ domain: sql`substring_index(${userTable.email}, '@', -1)` })
    //     .from(userTable)
    //     .groupBy(sql`substring_index(${userTable.email}, '@', -1)`)
    //     .orderBy(desc(count(userTable.id)))
    //     .then((r) => r.map((d) => d.domain)),
    // }));
    return new Layout({
      title: "User",
      children: [
        // io.display.object("Domains", domains),
        io.display.table("", {
          getData: async (input) => {
            return useTransaction(async (tx) => ({
              data: await tx
                .select()
                .from(userTable)
                .offset(input.offset)
                .limit(input.pageSize),
            }));
          },
          isSortable: false,
          isFilterable: false,
        }),
      ],
    });
  },
});
