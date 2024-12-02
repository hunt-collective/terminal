import { describe, it, expect } from "bun:test";
import { User } from "../src/user";

describe("user", () => {
  it("create", async () => {
    const user = await User.create({
      fingerprint: "test",
    });
    expect(await User.fromID(user)).toBeDefined();
    expect(await User.fromFingerprint("test")).toBeDefined();
  });
});
