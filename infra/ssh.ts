import { auth, authFingerprintKey, api } from "./api";
import { secret } from "./secret";
import { execSync } from "child_process";
import { domain } from "./dns";
import { cluster } from "./cluster";

sst.Linkable.wrap(tls.PrivateKey, (resource) => ({
  properties: {
    private: resource.privateKeyOpenssh,
    public: resource.publicKeyOpenssh,
  },
}));

export const key = new tls.PrivateKey("SSHKey", {
  algorithm: "ED25519",
});

cluster.addService("SSH", {
  cpu: "2 vCPU",
  memory: "4 GB",
  image: {
    context: "./packages/go",
  },
  link: [api, auth, secret.StripePublic, authFingerprintKey, key],
  environment: {
    VERSION: !$dev ? execSync("git rev-parse HEAD").toString().trim() : "",
  },
  public: {
    domain:
      $app.stage === "production"
        ? undefined
        : {
            name: domain,
            dns: sst.cloudflare.dns(),
          },
    rules: [
      { listen: "22/tcp", forward: "2222/tcp" },
      { listen: "80/tcp", forward: "8000/tcp" },
    ],
  },
  scaling:
    $app.stage === "production"
      ? {
          min: 2,
          max: 10,
        }
      : undefined,
  dev: {
    directory: "packages/go",
    command: "go run ./cmd/ssh",
  },
});
