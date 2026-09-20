import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/utils/constants";

const MONTHLY_SECONDS = 30 * 24 * 60 * 60;

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = (await req.json()) as { plan?: "weekly" | "monthly" };
  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const invoice: Record<string, unknown> = {
    title: `OneNite Premium — ${plan}`,
    description:
      plan === "monthly"
        ? "Recurring monthly: unlimited likes, 5 super likes/day, see who likes you."
        : "One-time 7-day pass: unlimited likes, 5 super likes/day, see who likes you.",
    payload: JSON.stringify({ uid: user.id, plan, ts: Date.now() }),
    currency: "XTR",
    prices: [{ label: `OneNite Premium ${plan}`, amount: PLANS[plan].stars }],
  };

  // Telegram recurring subscriptions must run 30–365 days.
  // Weekly is therefore sold as a one-time 7-day pass.
  if (plan === "monthly") invoice.subscription_period = MONTHLY_SECONDS;

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
    // Surface Telegram's exact reason in the app so we never guess again
    return NextResponse.json(
      { error: data.description ?? "Could not create invoice" },
      { status: 502 }
    );
  }
  return NextResponse.json({ invoiceLink: data.result });
}