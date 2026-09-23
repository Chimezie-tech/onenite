import { NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "@/lib/supabase/admin";
import type { AdPlacement } from "@/types";

const VALID_PLACEMENTS: AdPlacement[] = ["home", "chat", "profile"];

export async function POST(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    title?: string; subtitle?: string; image_url?: string; cta_label?: string;
    cta_type?: "internal" | "external"; cta_url?: string; placements?: AdPlacement[];
  };
  if (!body.title || !body.image_url || !body.cta_url) {
    return NextResponse.json({ error: "title, image_url and cta_url are required" }, { status: 400 });
  }
  const placements = (body.placements ?? ["home"]).filter((p) => VALID_PLACEMENTS.includes(p));
  if (placements.length === 0) return NextResponse.json({ error: "invalid placements" }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("ads")
    .insert({
      title: body.title,
      subtitle: body.subtitle ?? "",
      image_url: body.image_url,
      cta_label: body.cta_label || "Learn More",
      cta_type: body.cta_type ?? "external",
      cta_url: body.cta_url,
      placements,
    })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ad: data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Record<string, unknown>;
  const id = body.id as string | undefined;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  for (const key of ["title", "subtitle", "image_url", "cta_label", "cta_type", "cta_url", "placements"]) {
    if (key in body) patch[key] = body[key];
  }
  const { data, error } = await getSupabaseAdmin()
    .from("ads").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ad: data });
}

export async function DELETE(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await getSupabaseAdmin().from("ads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}