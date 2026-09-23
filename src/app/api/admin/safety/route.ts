import { NextResponse } from "next/server";
import { requireAdmin, getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = getSupabaseAdmin();
  const [tickets, reports] = await Promise.all([
    admin.from("support_tickets").select("*, user:profiles!user_id(first_name, username, telegram_id)").eq("resolved", false).order("created_at", { ascending: false }),
    admin.from("reports").select("*, reporter:profiles!reporter_id(first_name, username), reported:profiles!reported_id(first_name, username)").eq("status", "open").order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    tickets: tickets.data ?? [],
    reports: reports.data ?? [],
  });
}

export async function POST(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, id } = (await req.json()) as { action?: string; id?: string };
  if (!action || !id) return NextResponse.json({ error: "action + id required" }, { status: 400 });

  const admin = getSupabaseAdmin();
  if (action === "resolve_ticket") {
    await admin.from("support_tickets").update({ resolved: true }).eq("id", id);
  } else if (action === "resolve_report") {
    await admin.from("reports").update({ status: "resolved" }).eq("id", id);
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}