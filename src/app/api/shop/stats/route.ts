import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data } = await getSupabaseAdmin()
    .from("product_events").select("product_id, event");

  const views: Record<string, number> = {};
  const shares: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.event === "view") views[row.product_id] = (views[row.product_id] ?? 0) + 1;
    if (row.event === "share") shares[row.product_id] = (shares[row.product_id] ?? 0) + 1;
  }
  return NextResponse.json({ views, shares });
}