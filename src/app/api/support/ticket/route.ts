import { NextResponse } from "next/server";
import { requireUser, getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram/bot";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, message, reportedUsername } = (await req.json()) as {
    topic?: string; message?: string; reportedUsername?: string | null;
  };
  if (!topic || !message?.trim()) {
    return NextResponse.json({ error: "topic + message required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  await admin.from("support_tickets").insert({
    user_id: user.id, topic, message: message.trim(), reported_username: reportedUsername ?? null,
  });

  const ids = (process.env.ADMIN_TELEGRAM_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const { data: admins } = await admin.from("profiles").select("telegram_id").in("telegram_id", ids.map(Number));
  for (const a of admins ?? []) {
    await sendTelegramMessage(
      a.telegram_id,
      `🛟 ${topic} — from ${user.first_name} (@${user.username ?? user.telegram_id})${reportedUsername ? `\nReported: @${reportedUsername}` : ""}\n"${message.trim()}"`
    );
  }
  return NextResponse.json({ ok: true });
}