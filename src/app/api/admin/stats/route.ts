import { NextResponse } from "next/server";
import { requireAdmin, getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = getSupabaseAdmin();
  const [users, banned, premium, matches, likes, messages, reports, subs] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_premium", true),
    admin.from("matches").select("*", { count: "exact", head: true }),
    admin.from("likes").select("*", { count: "exact", head: true }).eq("is_pass", false),
    admin.from("messages").select("*", { count: "exact", head: true }),
    admin.from("reports").select("*", { count: "exact", head: true }),
    admin.from("subscriptions").select("amount"),
  ]);

  const stars = (subs.data ?? []).reduce((sum, row) => sum + ((row.amount as number) ?? 0), 0);
  return NextResponse.json({
    users: users.count ?? 0,
    banned: banned.count ?? 0,
    premium: premium.count ?? 0,
    matches: matches.count ?? 0,
    likes: likes.count ?? 0,
    messages: messages.count ?? 0,
    reports: reports.count ?? 0,
    stars,
  });
}