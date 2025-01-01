import { api, auth } from "./api";
import { domain } from "./dns";
import { vhs } from "./vhs";

export const www = new sst.aws.Astro("Site", {
  domain: {
    name: "www." + domain,
    dns: sst.cloudflare.dns(),
  },
  path: "./packages/www",
  buildCommand: "bun run build",
  link: [api, auth, vhs],
});

export const outputs = {
  www: www.url,
};
