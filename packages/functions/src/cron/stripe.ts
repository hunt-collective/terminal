import { Resource } from "sst";
import { Stripe } from "stripe";
import { DateTime } from "luxon";

const stripe = new Stripe(Resource.StripeSecret.value, {
  httpClient: Stripe.createFetchHttpClient(),
});

export async function handler() {
  const start = DateTime.now().minus({ weeks: 1 }).startOf("week");
  const [current, previous] = await Promise.all([
    getTotal(start),
    getTotal(start.minus({ weeks: 1 })),
  ]);
  const percent = Number((((current - previous) / previous) * 100).toFixed(2));
  const lines = [
    `${start.toFormat("LLL dd")}`,
    `Net Revenue: ${current.toLocaleString()} ${percent > 0 ? "(+" + percent + "%)" : ""}`,
  ];
  console.log(lines.join("\n"));
  fetch(Resource.SlackWebhook.value, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: ["```", ...lines, "```"].join("\n"),
    }),
  });
}

async function getTotal(start: DateTime) {
  const end = start.endOf("week");
  console.log("range", start.toISO(), end.toISO());
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
