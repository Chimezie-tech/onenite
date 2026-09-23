import { NextResponse } from "next/server";
import { requireUser, getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram/bot";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = (await req.json()) as { message?: string };
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const ids = (process.env.ADMIN_TELEGRAM_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const { data: admins } = await getSupabaseAdmin().from("profiles").select("telegram_id").in("telegram_id", ids.map(Number));
  
  for (const a of admins ?? []) {
    await sendTelegramMessage(
      a.telegram_id,
      `⚖️ BAN APPEAL from ${user.first_name} (@${user.username ?? user.telegram_id}):\n"${message.trim()}"`
    );
  }
  return NextResponse.json({ ok: true });
}