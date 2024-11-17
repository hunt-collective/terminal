import { domain } from "./dns";
import { secret } from "./secret";

const kv = new sst.cloudflare.Kv("AuthKV");

export const auth2 = new sst.cloudflare.Worker("Auth2", {
  handler: "./packages/workers/src/auth.ts",
  domain: "auth2." + domain,
  link: [kv, secret.TwitchClientID, secret.TwitchClientSecret],
  url: true,
});
