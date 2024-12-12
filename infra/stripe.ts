import { database } from "./database";
import { domain } from "./dns";
import { secret } from "./secret";

sst.Linkable.wrap(stripe.WebhookEndpoint, (endpoint) => {
  return {
    properties: {
      id: endpoint.id,
      secret: endpoint.secret,
    },
  };
});

export const webhook = new stripe.WebhookEndpoint(
  "StripeWebhook",
  {
    url: $interpolate`https://api.${domain}/hook/stripe`,
    metadata: {
      stage: $app.stage,
    },
    enabledEvents: [
      "payment_method.attached",
      "payment_method.detached",
      "payment_method.updated",
      "product.created",
      "product.updated",
      "product.deleted",
      "price.created",
      "price.updated",
      "price.deleted",
    ],
  },
  {
    import: "we_1PX5ycDgGJQx1Mr6OzMdZ9bG",
    ignoreChanges: ["*"],
  },
);

new sst.aws.Cron("StripeAnalytics", {
  schedule: "cron(0 12 ? * MON *)",
  job: {
    link: [
      secret.StripePublic,
      secret.StripeSecret,
      secret.SlackWebhook,
      database,
    ],
    timeout: "5 minutes",
    handler: "./packages/functions/src/cron/stripe.handler",
  },
});
