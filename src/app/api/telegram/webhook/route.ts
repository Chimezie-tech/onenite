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

  let payload: { uid?: string; plan?: PlanId; productId?: string };
  try {
    payload = JSON.parse(payment.invoice_payload);
  } catch {
    return NextResponse.json({ ok: true, ignored: true });
  }
  if (!payload.uid) return NextResponse.json({ ok: true, ignored: true });

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles").select("*").eq("id", payload.uid).maybeSingle();
  if (!profile) return NextResponse.json({ ok: true, ignored: true });

  // Legacy subscription payloads (no productId) still work
  const productId =
    payload.productId ?? (payload.plan ? `sub:${payload.plan}` : "");
  const [kind, id] = productId.split(":");

  function extend(from: string | null, addMs: number): Date {
    const current = from ? new Date(from) : null;
    const base = current && current > new Date() ? current : new Date();
    return new Date(base.getTime() + addMs);
  }

  if (kind === "sub" && (id === "weekly" || id === "monthly")) {
    const expiresAt = extend(profile.premium_expires_at, PLANS[id].days * 86400000);
    await admin.from("subscriptions").insert({
      user_id: profile.id,
      plan: id,
      payment_method: "telegram_stars",
      payment_id: payment.telegram_payment_charge_id ?? null,
      telegram_subscription_id: payment.subscription_subscription_id ?? null,
      amount: payment.total_amount ?? PLANS[id].stars,
      currency: "XTR",
      status: "active",
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });
    await admin
      .from("profiles")
      .update({ is_premium: true, premium_expires_at: expiresAt.toISOString() })
      .eq("id", profile.id);
    await sendTelegramMessage(
      profile.telegram_id,
      `💎 Welcome to OneNite Premium!\nYour ${id} plan is active until ${expiresAt.toDateString()}.`,
      OPEN_APP_BUTTON
    );
  } else if (kind === "onetime" && id === "super_likes_5") {
    await admin
      .from("profiles")
      .update({ bonus_super_likes: profile.bonus_super_likes + 5 })
      .eq("id", profile.id);
    await sendTelegramMessage(
      profile.telegram_id,
      `⚡ +5 Super Likes added to your account!\nBalance: ${profile.bonus_super_likes + 5} super likes.`,
      OPEN_APP_BUTTON
    );
  } else if (kind === "onetime" && id === "reveal_who_liked_you") {
    const until = extend(profile.reveal_until, 24 * 3600000);
    await admin
      .from("profiles")
      .update({ reveal_until: until.toISOString() })
      .eq("id", profile.id);
    await sendTelegramMessage(
      profile.telegram_id,
      `👀 Reveal unlocked for 24 hours!\nOpen the Likes tab to see everyone who likes you.`,
      OPEN_APP_BUTTON
    );
  } else if (kind === "boost" && id === "boost_30min") {
    const until = extend(profile.boosted_until, 30 * 60000);
    await admin
      .from("profiles")
      .update({ boosted_until: until.toISOString() })
      .eq("id", profile.id);
    await sendTelegramMessage(
      profile.telegram_id,
      `🚀 Boost active until ${until.toTimeString().slice(0, 5)}!\nYou're now first in the deck in your city.`,
      OPEN_APP_BUTTON
    );
  }

  return NextResponse.json({ ok: true });
}