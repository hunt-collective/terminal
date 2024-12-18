import { bus } from "./bus";
import { cluster } from "./cluster";
import { database } from "./database";
import { allSecrets } from "./secret";

const bucket = new sst.aws.Bucket("IntervalBucket");

cluster.addService("Forge", {
  link: [...allSecrets, database, bucket, bus],
  cpu: "0.25 vCPU",
  memory: "0.5 GB",
  image: {
    dockerfile: "packages/forge/Dockerfile",
  },
  environment: {
    DRIZZLE_LOG: "true",
  },
  dev: {
    directory: "packages/forge",
    command: "bun dev",
  },
});
