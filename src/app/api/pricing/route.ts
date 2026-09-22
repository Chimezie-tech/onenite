import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data } = await getSupabaseAdmin()
    .from("pricing").select("*").eq("active", true).order("key");
  return NextResponse.json(data ?? []);
}