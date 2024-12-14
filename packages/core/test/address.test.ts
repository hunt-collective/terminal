import { describe, expect } from "bun:test";
import { Address } from "../src/address";
import { withTestUser } from "./util";

describe("address", () => {
  withTestUser("create", async () => {
    await Address.create({
      name: "John Smith",
      street1: "2800 SW 28th Terrace",
      city: "Miami",
      country: "US",
      zip: "33133",
      province: "FL",
    });
    expect(await Address.list()).toHaveLength(1);
  });

  withTestUser("remove", async () => {
    const address = await Address.create({
      name: "John Smith",
      zip: "33133",
      city: "Miami",
      country: "US",
      street1: "2800 SW 28th Terrace",
      province: "FL",
    });
    await Address.remove(address);
    const all = await Address.list();
    expect(all).toHaveLength(0);
  });
});
