import { NextResponse } from "next/server";
import { requireUser, getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { viewedId } = (await req.json()) as { viewedId?: string };
  if (!viewedId || viewedId === user.id) return NextResponse.json({ ok: true, ignored: true });

  const admin = getSupabaseAdmin();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recent } = await admin
    .from("profile_views").select("id")
    .eq("viewer_id", user.id).eq("viewed_id", viewedId)
    .gt("created_at", yesterday).maybeSingle();

  if (!recent) {
    await admin.from("profile_views").insert({ viewer_id: user.id, viewed_id: viewedId });
  }
  return NextResponse.json({ ok: true });
}