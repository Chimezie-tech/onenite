import { NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const admin = getSupabaseAdmin();
  const [currencies, categories] = await Promise.all([
    admin.from("currencies").select("*").eq("active", true).order("code"),
    admin.from("categories").select("*").order("name"),
  ]);
  return NextResponse.json({
    currencies: currencies.data ?? [],
    categories: categories.data ?? [],
  });
}

export async function POST(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    type?: "currency" | "category";
    code?: string;
    symbol?: string;
    label?: string;
    kind?: string;
    name?: string;
  };

  const admin = getSupabaseAdmin();
  if (body.type === "currency") {
    if (!body.code || !body.symbol || !body.label) {
      return NextResponse.json({ error: "code, symbol and label required" }, { status: 400 });
    }
    const { error } = await admin.from("currencies").upsert({
      code: body.code.toLowerCase(),
      symbol: body.symbol,
      label: body.label,
      kind: body.kind ?? "fiat",
      active: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.type === "category") {
    if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const { error } = await admin
      .from("categories")
      .upsert({ name: body.name.trim() }, { onConflict: "name" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}