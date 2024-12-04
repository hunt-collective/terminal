import {
  eq,
  and,
  getTableColumns,
  isNull,
  desc,
  asc,
  inArray,
} from "drizzle-orm";
import { db } from "../drizzle";
import { userFingerprintTable, userShippingTable, userTable } from "./user.sql";
import { z } from "zod";
import { fn } from "../util/fn";
import { stripe } from "../stripe";
import { createID } from "../util/id";
import {
  createTransaction,
  afterTx,
  useTransaction,
} from "../drizzle/transaction";
import { Address } from "../address";
import { useUserID } from "../actor";
import { defineEvent } from "../event";
import { bus } from "sst/aws/bus";
import { Resource } from "sst";
import { Card } from "../card";
import { Shippo } from "../shippo/index";
import { orderTable } from "../order/order.sql";
import { cardTable } from "../card/card.sql";
import { subscriptionTable } from "../subscription/subscription.sql";

export module User {
  export const Info = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    fingerprint: z.string().nullable(),
    stripeCustomerID: z.string(),
  });

  export const Shipping = z.object({
    id: z.string(),
    address: Address,
  });
  export type Shipping = z.infer<typeof Shipping>;

  export const Events = {
    Created: defineEvent(
      "user.created",
      z.object({
        userID: Info.shape.id,
      }),
    ),
    Updated: defineEvent(
      "user.updated",
      z.object({
        userID: Info.shape.id,
      }),
    ),
  };

  export const create = fn(
    z.object({
      fingerprint: Info.shape.fingerprint.optional(),
      email: z.string().optional(),
    }),
    async (input) => {
      const id = createID("user");
      const customer = await stripe.customers.create({
        email: input.email,
        metadata: {
          userID: id,
        },
      });
      await createTransaction(async (tx) => {
        await tx.insert(userTable).values({
          id,
          email: input.email ?? customer?.email,
          name: customer?.name,
          stripeCustomerID: customer!.id,
        });
        if (input.fingerprint)
          await tx.insert(userFingerprintTable).values({
            userID: id,
            fingerprint: input.fingerprint,
          });
        await afterTx(() =>
          bus.publish(Resource.Bus, Events.Created, { userID: id }),
        );
        await Card.sync(customer!.id);
      });
      return id;
    },
  );

  export const merge = fn(z.string().array(), async (ids) => {
    const primary = ids.shift();
    if (!primary) throw new Error("No primary user");
    await useTransaction(async (tx) => {
      await tx
        .update(userFingerprintTable)
        .set({
          userID: primary,
        })
        .where(inArray(userFingerprintTable.userID, ids));

      await tx
        .update(orderTable)
        .set({
          userID: primary,
        })
        .where(inArray(orderTable.userID, ids));

      await tx
        .update(userShippingTable)
        .set({
          userID: primary,
        })
        .where(inArray(userShippingTable.userID, ids));

      // do not merge cards for now
      // await tx
      //   .update(cardTable)
      //   .set({
      //     userID: primary,
      //   })
      //   .where(inArray(cardTable.userID, ids));

      await tx
        .update(subscriptionTable)
        .set({
          userID: primary,
        })
        .where(inArray(subscriptionTable.userID, ids));

      await tx
        .update(userTable)
        .set({
          timeDeleted: new Date(),
        })
        .where(inArray(userTable.id, ids));
    });

    return primary;
  });

  export const update = fn(
    Info.pick({ name: true, email: true, id: true }).partial({
      name: true,
      email: true,
    }),
    (input) =>
      useTransaction(async (tx) => {
        await afterTx(() =>
          bus.publish(Resource.Bus, Events.Updated, {
            userID: input.id,
          }),
        );
        await tx
          .update(userTable)
          .set({
            name: input.name,
            email: input.email,
          })
          .where(eq(userTable.id, input.id));
      }),
  );

  export const fromFingerprint = fn(z.string(), async (fingerprint) =>
    db
      .select(getTableColumns(userTable))
      .from(userFingerprintTable)
      .innerJoin(userTable, eq(userTable.id, userFingerprintTable.userID))
      .where(eq(userFingerprintTable.fingerprint, fingerprint))
      .then((rows) => rows.map(serialize).at(0)),
  );

  export const fromID = fn(Info.shape.id, async (id) =>
    useTransaction((tx) =>
      tx
        .select()
        .from(userTable)
        .where(eq(userTable.id, id))
        .then((rows) => rows.map(serialize).at(0)),
    ),
  );

  export const fromEmail = fn(z.string(), async (email) =>
    useTransaction(async (tx) =>
      tx
        .select()
        .from(userTable)
        .where(and(eq(userTable.email, email), isNull(userTable.timeDeleted)))
        .orderBy(asc(userTable.timeCreated))
        .then((rows) => rows.map(serialize)),
    ),
  );

  export const fromCustomerID = fn(Info.shape.stripeCustomerID, async (id) =>
    useTransaction((tx) =>
      tx
        .select()
        .from(userTable)
        .where(eq(userTable.stripeCustomerID, id))
        .then((rows) => rows.map(serialize).at(0)),
    ),
  );

  export const addShipping = fn(Shippo.assertValidAddress.schema, (input) =>
    useTransaction(async (tx) => {
      const validated = await Shippo.assertValidAddress(input);
      const id = createID("userShipping");
      await tx.insert(userShippingTable).values({
        id,
        userID: useUserID(),
        address: validated,
      });
      return id;
    }),
  );

  export const removeShipping = fn(z.string(), (input) =>
    useTransaction(async (tx) => {
      await tx
        .delete(userShippingTable)
        .where(
          and(
            eq(userShippingTable.id, input),
            eq(userShippingTable.userID, useUserID()),
          ),
        );
    }),
  );

  export async function shipping() {
    return useTransaction(async (tx) =>
      tx
        .select()
        .from(userShippingTable)
        .where(eq(userShippingTable.userID, useUserID()))
        .then((rows): Shipping[] =>
          rows.map((row) => ({
            id: row.id,
            address: row.address,
          })),
        ),
    );
  }

  function serialize(
    input: typeof userTable.$inferSelect,
  ): z.infer<typeof Info> {
    return {
      id: input.id,
      name: input.name,
      email: input.email,
      fingerprint: input.fingerprint,
      stripeCustomerID: input.stripeCustomerID,
    };
  }
}
