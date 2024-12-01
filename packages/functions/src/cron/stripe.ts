import { Resource } from "sst";
import { Stripe } from "stripe";
import { DateTime } from "luxon";
import { and, db, isNull, lt, gt, or } from "@terminal/core/drizzle/index";
import { subscriptionTable } from "@terminal/core/subscription/subscription.sql";

const stripe = new Stripe(Resource.StripeSecret.value, {
  httpClient: Stripe.createFetchHttpClient(),
});

export async function handler() {
  const current = DateTime.now().minus({ weeks: 1 }).startOf("week");
  console.log(`Analyzing ${current.toFormat("LLL dd")}`);
  const last = current.minus({ weeks: 1 });
  const [revenue, revenueLast, subs, subsLast] = await Promise.all([
    getRevenue(current),
    getRevenue(last),
    getSubscription(current),
    getSubscription(last),
  ]);
  const revenuePercent = Number(
    (((revenue - revenueLast) / revenueLast) * 100).toFixed(2),
  );
  const subsPercent = Number((((subs - subsLast) / subsLast) * 100).toFixed(2));

  const lines = [
    `${current.toFormat("LLL dd")} Summary`,
    `Net Revenue: $${revenue.toLocaleString()} (${revenuePercent > 0 ? "+" : ""}${revenuePercent}%)`,
    `Total Subscriptions: ${subs} (${subsPercent > 0 ? "+" : ""}${subsPercent}%)`,
  ];
  console.log(lines.join("\n"));
  if (Resource.App.stage === "production") {
    await fetch(Resource.SlackWebhook.value, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: ["```", ...lines, "```"].join("\n"),
      }),
    });
  }
}

async function getRevenue(start: DateTime) {
  const end = start.endOf("week");
  const run = await stripe.reporting.reportRuns.create({
    report_type: "balance.summary.1",
    parameters: {
      interval_start: start.toUnixInteger(),
      interval_end: end.toUnixInteger(),
    },
  });

  while (true) {
    const report = await stripe.reporting.reportRuns.retrieve(run.id);
    if (report.status === "succeeded") {
      const text = await fetch(report.result!.url!, {
        headers: { Authorization: `Bearer ${Resource.StripeSecret.value}` },
      }).then((res) => res.text());
      const rows = text
        .split("\n")
        .map((row) => row.split(",").map((v) => v.trim().replaceAll('"', "")));
      const [headers, ...data] = rows;
      const parsed = data.map((row) =>
        Object.fromEntries(headers!.map((header, i) => [header, row[i]])),
      );
      const activity = parsed.find((row) => row.category === "activity");
      return parseFloat(activity!.net_amount!);
    }
    console.log("waiting for report to finish...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function getSubscription(start: DateTime) {
  const end = start.endOf("week");
  const total = await db.$count(
    subscriptionTable,
    and(
      or(
        isNull(subscriptionTable.timeDeleted),
        gt(subscriptionTable.timeDeleted, end.toJSDate()),
      ),
      lt(subscriptionTable.timeCreated, end.toJSDate()),
    ),
  );
  return total;
}
