import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTelegramMessage, OPEN_APP_BUTTON } from "@/lib/telegram/bot";
import { PLANS } from "@/lib/utils/constants";
import type { PlanId } from "@/types";

interface SuccessfulPayment {
  currency?: string;
  total_amount?: number;
  invoice_payload?: string;
  telegram_payment_charge_id?: string;
  subscription_subscription_id?: string;
}
interface Update {
  message?: { successful_payment?: SuccessfulPayment };
}

export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update = (await req.json().catch(() => ({}))) as Update;
  const payment = update.message?.successful_payment;
  if (!payment?.invoice_payload) return NextResponse.json({ ok: true, ignored: true });

  let payload: { uid?: string; plan?: PlanId };
  try {
    payload = JSON.parse(payment.invoice_payload);
  } catch {
    return NextResponse.json({ ok: true, ignored: true });
  }
  if (!payload.uid || !payload.plan || !(payload.plan in PLANS)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles").select("*").eq("id", payload.uid).maybeSingle();
  if (!profile) return NextResponse.json({ ok: true, ignored: true });

  // Renewals extend from current expiry; new/lapsed subs start now
  const currentExpiry = profile.premium_expires_at ? new Date(profile.premium_expires_at) : null;
  const base = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
  const expiresAt = new Date(base.getTime() + PLANS[payload.plan].days * 24 * 60 * 60 * 1000);

  await admin.from("subscriptions").insert({
    user_id: profile.id,
    plan: payload.plan,
    payment_method: "telegram_stars",
    payment_id: payment.telegram_payment_charge_id ?? null,
    telegram_subscription_id: payment.subscription_subscription_id ?? null,
    amount: payment.total_amount ?? PLANS[payload.plan].stars,
    currency: "XTR",
    status: "active",
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  await admin.from("profiles")
    .update({ is_premium: true, premium_expires_at: expiresAt.toISOString() })
    .eq("id", profile.id);

  await sendTelegramMessage(
    profile.telegram_id,
    `💎 Welcome to OneNite Premium!\nYour ${payload.plan} plan is active until ${expiresAt.toDateString()}.`,
    OPEN_APP_BUTTON
  );

  return NextResponse.json({ ok: true });
}