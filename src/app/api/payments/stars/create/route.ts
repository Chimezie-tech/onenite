import { NextResponse } from "next/server";
import { requireUser, getSupabaseAdmin } from "@/lib/supabase/admin";
import { PLANS, ONE_TIME_ITEMS, BOOSTS } from "@/lib/utils/constants";

const MONTHLY_SECONDS = 30 * 24 * 60 * 60;

interface PurchaseRequest {
  kind?: "subscription" | "onetime" | "boost";
  plan?: "weekly" | "monthly";
  item?: string;
  boost?: string;
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as PurchaseRequest;
  let title = "";
  let description = "";
  let stars = 0;
  let productId = "";
  let subscriptionPeriod: number | undefined;

  if (body.kind === "subscription" && body.plan && body.plan in PLANS) {
    const plan = PLANS[body.plan];
    title = `OneNite Premium — ${body.plan}`;
    description =
      body.plan === "monthly"
        ? "Recurring monthly premium."
        : "One-time 7-day premium pass.";
    stars = plan.stars;
    productId = `sub:${body.plan}`;
    if (body.plan === "monthly") subscriptionPeriod = MONTHLY_SECONDS;
  } else if (body.kind === "onetime" && body.item && body.item in ONE_TIME_ITEMS) {
    const item = ONE_TIME_ITEMS[body.item as keyof typeof ONE_TIME_ITEMS];
    title = item.label;
    description = item.description;
    stars = item.stars;
    productId = `onetime:${item.id}`;
  } else if (body.kind === "boost" && body.boost && body.boost in BOOSTS) {
    const boost = BOOSTS[body.boost as keyof typeof BOOSTS];
    title = boost.label;
    description = boost.description;
    stars = boost.stars;
    productId = `boost:${boost.id}`;
  } else {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  // Dynamic pricing override from admin console
  const { data: priceRow } = await getSupabaseAdmin()
    .from("pricing")
    .select("stars, currency")
    .eq("key", productId)
    .maybeSingle();

  if (priceRow && priceRow.currency !== "stars") {
    return NextResponse.json(
      { error: "This item is priced in fiat — local payments coming soon" },
      { status: 400 }
    );
  }
  if (priceRow?.stars) stars = priceRow.stars;

  const invoice: Record<string, unknown> = {
    title,
    description,
    payload: JSON.stringify({ uid: user.id, productId, ts: Date.now() }),
    currency: "XTR",
    prices: [{ label: title, amount: stars }],
  };
  if (subscriptionPeriod) invoice.subscription_period = subscriptionPeriod;

  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    }
  );

  const data = (await res.json()) as {
    ok?: boolean;
    result?: string;
    description?: string;
  };
  if (!data.ok || !data.result) {
    console.error("[stars] createInvoiceLink failed:", data.description);
    return NextResponse.json(
      { error: data.description ?? "Could not create invoice" },
      { status: 502 }
    );
  }
  return NextResponse.json({ invoiceLink: data.result });
}