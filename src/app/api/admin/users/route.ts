import { NextResponse } from "next/server";
import { requireAdmin, getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const city = url.searchParams.get("city") ?? "";
  const gender = url.searchParams.get("gender") ?? "";
  const premium = url.searchParams.get("premium") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = 20;

  let query = getSupabaseAdmin().from("profiles").select("*", { count: "exact" });
  if (q) query = query.or(`first_name.ilike.%${q}%,username.ilike.%${q}%`);
  if (city) query = query.ilike("city", `%${city}%`);
  if (gender) query = query.eq("gender", gender);
  if (premium === "yes") query = query.eq("is_premium", true);
  if (premium === "no") query = query.eq("is_premium", false);
  if (status === "banned") query = query.eq("is_banned", true);
  if (status === "active") query = query.eq("is_banned", false);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [], total: count ?? 0, page, pageSize });
}