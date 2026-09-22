import { NextResponse } from "next/server";
import { requireAdmin, getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram/bot";

export async function POST(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    filters?: { q?: string; city?: string; gender?: string; premium?: string; status?: string };
    message?: string;
  };
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  let query = admin.from("profiles").select("telegram_id").limit(1000);
  const f = body.filters ?? {};
  if (f.q) query = query.or(`first_name.ilike.%${f.q}%,username.ilike.%${f.q}%`);
  if (f.city) query = query.ilike("city", `%${f.city}%`);
  if (f.gender) query = query.eq("gender", f.gender);
  if (f.premium === "yes") query = query.eq("is_premium", true);
  if (f.premium === "no") query = query.eq("is_premium", false);
  if (f.status === "banned") query = query.eq("is_banned", true);
  if (f.status === "active") query = query.eq("is_banned", false);

  const { data } = await query;
  let sent = 0;
  for (const row of data ?? []) {
    const ok = await sendTelegramMessage(row.telegram_id, body.message);
    if (ok) sent += 1;
  }
  return NextResponse.json({ ok: true, sent, total: (data ?? []).length });
}