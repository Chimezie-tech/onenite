import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTelegramMessage, OPEN_APP_BUTTON } from "@/lib/telegram/bot";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    record?: { id?: string };
    matchId?: string;
  };
  const matchId = body.record?.id ?? body.matchId;
  if (!matchId) return NextResponse.json({ error: "missing match id" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: match } = await admin
    .from("matches").select("*").eq("id", matchId).maybeSingle();
  if (!match || match.notified_at) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { data: users } = await admin
    .from("profiles")
    .select("id, first_name, telegram_id")
    .in("id", [match.user1_id, match.user2_id]);
  if (!users || users.length !== 2) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  for (const user of users) {
    const other = users.find((u) => u.id !== user.id);
    await sendTelegramMessage(
      user.telegram_id,
      `🎉 It's a Match!\nYou and ${other?.first_name ?? "someone"} liked each other.\nSay hello 👋`,
      OPEN_APP_BUTTON
    );
  }

  await admin.from("matches")
    .update({ notified_at: new Date().toISOString() }).eq("id", matchId);
  return NextResponse.json({ ok: true });
}