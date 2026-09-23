import { NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

const EDITABLE = [
  "name", "price", "currency", "image_url", "thumbnail_url", "images",
  "description", "location", "shipping_available", "colors", "cta_url",
  "category_id", "units_sold", "status",
];

function pick(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of EDITABLE) if (key in body) out[key] = body[key];
  return out;
}

export async function POST(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Record<string, unknown>;
  if (!body.name || body.price === undefined) {
    return NextResponse.json({ error: "name + price required" }, { status: 400 });
  }
  const payload = pick(body);
  payload.currency = body.currency ?? "ngn";

  const { data, error } = await getSupabaseAdmin()
    .from("products").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Record<string, unknown>;
  const id = body.id as string | undefined;
    if (body.units_sold_increment) {
    const { data: current } = await getSupabaseAdmin()
      .from("products").select("units_sold").eq("id", id).maybeSingle();
    const { data, error } = await getSupabaseAdmin()
      .from("products")
      .update({ units_sold: ((current?.units_sold as number) ?? 0) + 1 })
      .eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data });
  }
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("products").update(pick(body)).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await getSupabaseAdmin().from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}