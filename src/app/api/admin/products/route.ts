import { NextResponse } from "next/server";
import { requireAdmin, getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Record<string, unknown>;
  if (!body.name || body.price === undefined) {
    return NextResponse.json({ error: "name + price required" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().from("products").insert({
    name: body.name,
    price: body.price,
    image_url: body.image_url ?? "",
    thumbnail_url: body.thumbnail_url ?? null,
    images: body.images ?? [],
    description: body.description ?? null,
    location: body.location ?? null,
    shipping_available: body.shipping_available ?? false,
    colors: body.colors ?? [],
    cta_url: body.cta_url ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}