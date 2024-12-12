import { authorizer } from "@openauthjs/openauth";
import { PasswordAdapter } from "@openauthjs/openauth/adapter/password";
import { Adapter } from "@openauthjs/openauth/adapter/adapter";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { CodeAdapter } from "@openauthjs/openauth/adapter/code";
import { CodeUI } from "@openauthjs/openauth/ui/code";
import { Select } from "@openauthjs/openauth/ui/select";
import { TwitchAdapter } from "@openauthjs/openauth/adapter/twitch";
import { GithubAdapter } from "@openauthjs/openauth/adapter/github";
import { subjects } from "./subject.js";
import { THEME_TERMINAL } from "@openauthjs/openauth/ui/theme";
import { Resource } from "sst";
import { handle } from "hono/aws-lambda";
import { User } from "@terminal/core/user/index";

const app = authorizer({
  subjects,
  theme: THEME_TERMINAL,
  select: Select({
    providers: {
      ssh: {
        hide: true,
      },
    },
  }),
  providers: {
    password: PasswordAdapter(
      PasswordUI({
        sendCode: async (email, code) => {
          console.log(email, code);
        },
      }),
    ),
    code: CodeAdapter<{ email: string }>(
      CodeUI({
        sendCode: async (code, claims) => {
          console.log(code, claims);
        },
      }),
    ),
    twitch: TwitchAdapter({
      clientID: Resource.TwitchClientID.value,
      clientSecret: Resource.TwitchClientSecret.value,
      scopes: ["user:read:email"],
    }),
    github: GithubAdapter({
      clientID: Resource.GithubClientID.value,
      clientSecret: Resource.GithubClientSecret.value,
      scopes: ["user:email"],
    }),
    ssh: {
      type: "ssh",
      async client(input) {
        if (input.clientSecret !== Resource.AuthFingerprintKey.value) {
          throw new Error("Invalid authorization token");
        }
        const fingerprint = input.params.fingerprint;
        if (!fingerprint) {
          throw new Error("Fingerprint is required");
        }
        return {
          fingerprint,
        };
      },
      init() {},
    } as Adapter<{
      fingerprint: string;
    }>,
  },
  allow: async (input) => {
    const hostname = new URL(input.redirectURI).hostname;
    if (hostname.endsWith("terminal.shop")) return true;
    if (hostname === "localhost") return true;
    return false;
  },
  success: async (ctx, value) => {
    if (value.provider === "ssh") {
      let id = await User.fromFingerprint(value.fingerprint).then((x) => x?.id);
      if (!id) {
        id = await User.create({
          fingerprint: value.fingerprint,
        });
      }
      return ctx.subject("user", {
        userID: id!,
      });
    }

    let email = undefined as string | undefined;
    if (value.provider === "github") {
      const access = value.tokenset.access;
      const response = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `token ${access}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      const emails = (await response.json()) as any[];
      const primary = emails.find((email: any) => email.primary);
      console.log(primary);
      if (!primary.verified) {
        throw new Error("Email not verified");
      }
      email = primary.email;
    }

    if (email) {
      const matching = await User.fromEmail(email);
      if (matching.length === 0) {
        const id = await User.create({
          email,
        });
        return ctx.subject("user", {
          userID: id,
        });
      }
      if (matching.length === 1) {
        return ctx.subject("user", {
          userID: matching[0]!.id,
        });
      }
      if (matching.length > 1) {
        const id = await User.merge(matching.map((x) => x.id));
        return ctx.subject("user", {
          userID: id!,
        });
      }
    }

    return new Response("something went wrong", { status: 500 });
  },
});

// @ts-ignore
export const handler = handle(app);
