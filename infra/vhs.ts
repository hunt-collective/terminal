import { api, auth, authFingerprintKey } from "./api";
import { cluster } from "./cluster";
import { domain } from "./dns";
import { secret } from "./secret";
import { key } from "./ssh";

const bucket = new sst.aws.Bucket("VhsBucket", {
  access: "cloudfront",
});

const service = cluster.addService("VHS", {
  image: {
    dockerfile: "./packages/vhs/Dockerfile",
  },
  loadBalancer: {
    ports: [{ listen: "80/http", forward: "3001/http" }],
  },
  dev: {
    directory: "packages/vhs",
    command: "bun dev",
  },
  link: [api, auth, secret.StripePublic, authFingerprintKey, key],
});

export const router = new sst.aws.Router("VhsRouter", {
  routes: {
    "/*": {
      url: service.url,
    },
  },
  // transform:
  //   $app.stage === "production" || $app.stage === "dev"
  //     ? {
  //         cdn: (args) => {
  //           args.origins = [
  //             {
  //               domainName: bucket.nodes.bucket.bucketRegionalDomainName,
  //               originId: "bucket",
  //             },
  //             {
  //               domainName: service.nodes.loadBalancer.dnsName,
  //               originId: "service",
  //             },
  //           ];
  //           args.originGroups = [
  //             {
  //               originId: "default",
  //               failoverCriteria: {
  //                 statusCodes: [403, 404],
  //               },
  //               members: [
  //                 {
  //                   originId: "bucket",
  //                 },
  //                 {
  //                   originId: "service",
  //                 },
  //               ],
  //             },
  //           ];
  //         },
  //       }
  //     : undefined,
  domain: {
    name: "vhs." + domain,
    dns: sst.cloudflare.dns(),
  },
});
