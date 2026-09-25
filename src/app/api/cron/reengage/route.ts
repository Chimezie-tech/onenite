import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTelegramMessage, OPEN_APP_BUTTON } from "@/lib/telegram/bot";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // 1) Rescue nudge: signed up 24h+ ago but never finished onboarding
  const { data: incomplete } = await admin
    .from("profiles").select("id, telegram_id, first_name")
    .eq("onboarding_completed", false)
    .is("signup_nudged_at", null)
    .lt("created_at", new Date(Date.now() - 24 * 3600000).toISOString())
    .limit(50);

  for (const u of incomplete ?? []) {
    await sendTelegramMessage(
      u.telegram_id,
      `Hey ${u.first_name}! 👋 You're 30 seconds from matching on OneNite — add your city + 1 photo to unlock your deck.`,
      OPEN_APP_BUTTON
    );
    await admin.from("profiles").update({ signup_nudged_at: new Date().toISOString() }).eq("id", u.id);
  }

  // 2) Dormant-user re-engagement (72h absence + unseen likes)
  const limit = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const lastSentLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: dormant } = await admin
    .from("profiles").select("id, telegram_id, first_name, last_active_at")
    .lt("last_active_at", limit)
    .or(`last_reengaged_at.is.null,last_reengaged_at.lt.${lastSentLimit}`)
    .eq("is_banned", false)
    .eq("onboarding_completed", true)
    .limit(50);

  for (const user of dormant ?? []) {
    const { count } = await admin
      .from("likes").select("*", { count: "exact", head: true })
      .eq("to_user_id", user.id).eq("is_pass", false)
      .gt("created_at", user.last_active_at);

    if (count && count > 0) {
      await sendTelegramMessage(
        user.telegram_id,
        `💗 ${count} ${count === 1 ? "person" : "people"} liked you while you were away!\nOpen OneNite to see who.`,
        OPEN_APP_BUTTON
      );
      await admin.from("profiles").update({ last_reengaged_at: new Date().toISOString() }).eq("id", user.id);
    }
  }

  return NextResponse.json({ ok: true, nudged: (incomplete ?? []).length, processed: (dormant ?? []).length });
}