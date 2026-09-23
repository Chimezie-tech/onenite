import { NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = getSupabaseAdmin();
  const [products, events, ads, categories] = await Promise.all([
    admin.from("products").select("id, name, units_sold, category_id, price, currency"),
    admin.from("product_events").select("product_id, event"),
    admin.from("ads").select("id, title, impressions, clicks"),
    admin.from("categories").select("id, name"),
  ]);

  const perProduct: Record<string, { views: number; clicks: number; shares: number }> = {};
  for (const e of events.data ?? []) {
    const bucket = (perProduct[e.product_id] ??= { views: 0, clicks: 0, shares: 0 });
    if (e.event === "view") bucket.views += 1;
    if (e.event === "click") bucket.clicks += 1;
    if (e.event === "share") bucket.shares += 1;
  }

  const productRows = (products.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    currency: p.currency,
    category_id: p.category_id,
    units_sold: p.units_sold ?? 0,
    ...(perProduct[p.id] ?? { views: 0, clicks: 0, shares: 0 }),
  }));

  const byCategory = (categories.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    count: (products.data ?? []).filter((p) => p.category_id === c.id).length,
  }));

  return NextResponse.json({
    products: productRows,
    byCategory,
    ads: (ads.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      impressions: a.impressions ?? 0,
      clicks: a.clicks ?? 0,
    })),
  });
}