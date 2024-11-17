import { authorizer } from "@openauthjs/core";
import { CloudflareStorage } from "@openauthjs/core/storage/cloudflare";
import { TwitchAdapter } from "@openauthjs/core/adapter/twitch";
import { Resource } from "sst";
import { subjects } from "./subjects";

export default {
  fetch: (request: Request, env: any, ctx: any) => {
    return authorizer({
      subjects,
      storage: CloudflareStorage({
        namespace: Resource.AuthKV,
      }),
      providers: {
        twitch: TwitchAdapter({
          clientSecret: Resource.TwitchClientSecret.value,
          clientID: Resource.TwitchClientID.value,
          scopes: ["user_read"],
        }),
      },
      allow: async () => true,
      success: async (ctx, value) => {
        if (value.provider === "twitch") {
          const response = await fetch("https://api.twitch.tv/helix/users", {
            headers: {
              Authorization: `Bearer ${value.tokenset.accessToken()}`,
              "Client-Id": Resource.TwitchClientID.value,
              "Content-Type": "application/json",
            },
          }).then((r) => r.json() as any);
          return ctx.session("user", {
            email: response.data[0].email,
          });
        }
        return Response.json(value);
      },
    }).fetch(request, env, ctx);
  },
};
