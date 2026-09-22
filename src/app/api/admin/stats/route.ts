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

    const since = new Date(Date.now() - 13 * 86400000).toISOString();
  const [pRows, lRows, mRows, sRows] = await Promise.all([
    admin.from("profiles").select("created_at").gte("created_at", since),
    admin.from("likes").select("created_at").gte("created_at", since),
    admin.from("messages").select("created_at").gte("created_at", since),
    admin.from("subscriptions").select("started_at, amount").gte("started_at", since),
  ]);
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }
  const countBy = (rows: Array<{ created_at: string }> | null) =>
    days.map((d) => (rows ?? []).filter((r) => r.created_at.slice(0, 10) === d).length);
  const series = {
    days,
    newUsers: countBy((pRows.data ?? []) as Array<{ created_at: string }>),
    likes: countBy((lRows.data ?? []) as Array<{ created_at: string }>),
    messages: countBy((mRows.data ?? []) as Array<{ created_at: string }>),
    revenue: days.map((d) =>
      ((sRows.data ?? []) as Array<{ started_at: string; amount: number }>)
        .filter((r) => r.started_at.slice(0, 10) === d)
        .reduce((s, r) => s + (r.amount ?? 0), 0)
    ),
  };
  return NextResponse.json({
    users: users.count ?? 0,
    banned: banned.count ?? 0,
    premium: premium.count ?? 0,
    matches: matches.count ?? 0,
    likes: likes.count ?? 0,
    messages: messages.count ?? 0,
    reports: reports.count ?? 0,
    stars,
    series
  });
}