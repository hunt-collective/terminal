/// <reference path="./.sst/platform/config.d.ts" />
import { readdirSync } from "fs";
export default $config({
  app(input) {
    return {
      name: "terminal-shop",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "us-east-2",
          profile: process.env.GITHUB_ACTIONS
            ? undefined
            : input.stage === "production"
              ? "terminal-production"
              : "terminal-dev",
        },
        planetscale: true,
        cloudflare: true,
        "pulumi-stripe": true,
        random: true,
        tls: true,
      },
    };
  },
  async run() {
    $transform(cloudflare.WorkerScript, (script) => {
      script.logpush = true;
    });
    sst.Linkable.wrap(cloudflare.Record, function (record) {
      return {
        properties: {
          url: $interpolate`https://${record.name}`,
        },
      };
    });
    const outputs = {};
    for (const value of readdirSync("./infra/")) {
      const result = await import("./infra/" + value);
      if (result.outputs) Object.assign(outputs, result.outputs);
    }
    return outputs;
  },
  console: {
    autodeploy: {
      runner: {
        engine: "codebuild",
      },
      target: (input) => {
        if (input.type === "branch") {
          if (input.branch === "dev") return { stage: "sandbox" };
          if (input.branch === "production") return { stage: "production" };
        }
      },
    },
  },
});
