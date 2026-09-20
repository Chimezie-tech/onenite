import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTelegramMessage, OPEN_APP_BUTTON } from "@/lib/telegram/bot";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const limit = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const lastSentLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: dormant } = await admin
    .from("profiles").select("id, telegram_id, first_name, last_active_at")
    .lt("last_active_at", limit)
    .or(`last_reengaged_at.is.null,last_reengaged_at.lt.${lastSentLimit}`)
    .eq("is_banned", false)
    .eq("onboarding_completed", true)
    .limit(50);

  if (!dormant || dormant.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  for (const user of dormant) {
    const { count } = await admin
      .from("likes").select("*", { count: "exact", head: true })
      .eq("to_user_id", user.id)
      .eq("is_pass", false)
      .gt("created_at", user.last_active_at);

    if (count && count > 0) {
      await sendTelegramMessage(
        user.telegram_id,
        `💗 ${count} ${count === 1 ? "person" : "people"} liked you while you were away!\nOpen OneNite to see who.`,
        OPEN_APP_BUTTON
      );
      await admin.from("profiles")
        .update({ last_reengaged_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  }

  return NextResponse.json({ ok: true, processed: dormant.length });
}