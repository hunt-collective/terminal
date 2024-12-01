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

export const webhook = new stripe.WebhookEndpoint("StripeWebhook", {
  url: $interpolate`https://openapi.${domain}/hook/stripe`,
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
});

new sst.aws.Cron("StripeAnalytics", {
  schedule: "cron(0 7 ? * MON *)",
  job: {
    link: [secret.StripePublic, secret.StripeSecret, secret.SlackWebhook],
    handler: "./packages/functions/src/cron/stripe.handler",
  },
});
