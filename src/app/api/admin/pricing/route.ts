import { NextResponse } from "next/server";
import { requireAdmin, getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key, stars, currency } = (await req.json()) as {
    key?: string; stars?: number; currency?: string;
  };
  if (!key || !stars) return NextResponse.json({ error: "key + stars required" }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from("pricing")
    .update({ stars, currency: currency ?? "stars", updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}