import { api } from "./api";
import { domain } from "./dns";

export const www = new sst.aws.Astro("Site", {
  domain: {
    name: "www." + domain,
    dns: sst.cloudflare.dns(),
  },
  path: "./packages/www",
  buildCommand: "bun run build",
  link: [api],
});

export const outputs = {
  www: www.url,
};
