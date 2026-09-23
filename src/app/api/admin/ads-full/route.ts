import { NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await getSupabaseAdmin()
    .from("ads").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ads: data ?? [] });
}