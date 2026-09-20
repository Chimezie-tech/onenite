import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/utils/constants";

const PERIOD_SECONDS: Record<"weekly" | "monthly", number> = {
  weekly: 7 * 24 * 60 * 60,
  monthly: 30 * 24 * 60 * 60,
};

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = (await req.json()) as { plan?: "weekly" | "monthly" };
  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `OneNite Premium — ${plan}`,
        description: "Unlimited likes, 5 super likes/day, see who likes you.",
        payload: JSON.stringify({ uid: user.id, plan, ts: Date.now() }),
        currency: "XTR",
        prices: [{ label: `OneNite Premium ${plan}`, amount: PLANS[plan].stars }],
        subscription_period: PERIOD_SECONDS[plan],
      }),
    }
  );

  const data = (await res.json()) as { ok?: boolean; result?: string; description?: string };
  if (!data.ok || !data.result) {
    console.error("[stars] createInvoiceLink failed:", data.description);
    return NextResponse.json({ error: "Could not create invoice" }, { status: 500 });
  }
  return NextResponse.json({ invoiceLink: data.result });
}