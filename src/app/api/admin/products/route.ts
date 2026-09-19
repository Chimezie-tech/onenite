import { NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    name?: string; price?: number; currency?: string;
    image_url?: string; description?: string; cta_label?: string; cta_url?: string;
  };
  if (!body.name || body.price === undefined || !body.image_url) {
    return NextResponse.json({ error: "name, price and image_url are required" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .insert({
      name: body.name,
      price: body.price,
      currency: body.currency ?? "NGN",
      image_url: body.image_url,
      description: body.description ?? "",
      cta_label: body.cta_label ?? "Buy Now",
      cta_url: body.cta_url || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data }, { status: 201 });
}