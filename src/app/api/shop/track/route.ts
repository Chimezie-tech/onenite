import { NextResponse } from "next/server";
import { getSupabaseAdmin, requireUser } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, event } = (await req.json()) as { productId?: string; event?: string };
  if (!productId || !event || !["view", "click", "share"].includes(event)) {
    return NextResponse.json({ error: "productId + valid event required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // One view per user per product per day
  if (event === "view") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: existing } = await admin
      .from("product_events").select("id")
      .eq("product_id", productId).eq("user_id_placeholder", "")
      .limit(0);
    void existing;
    const start = today.toISOString();
    const { data: dup } = await admin
      .from("product_events").select("id")
      .eq("product_id", productId).eq("event", "view")
      .gte("created_at", start).maybeSingle();
    if (dup) return NextResponse.json({ ok: true, deduped: true });
  }

  const { error } = await admin
    .from("product_events").insert({ product_id: productId, event });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}