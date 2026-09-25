import { NextResponse } from "next/server";
import { requireAdmin, getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const [profile, photos, sent, received, matches, reports] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).maybeSingle(),
    admin.from("profile_photos").select("*").eq("user_id", id).order("created_at"),
    admin.from("likes").select("*", { count: "exact", head: true }).eq("from_user_id", id).eq("is_pass", false),
    admin.from("likes").select("*", { count: "exact", head: true }).eq("to_user_id", id).eq("is_pass", false),
    admin.from("matches").select("*", { count: "exact", head: true }).or(`user1_id.eq.${id},user2_id.eq.${id}`),
    admin.from("reports").select("*", { count: "exact", head: true }).eq("reported_id", id),
  ]);

  if (!profile.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    profile: profile.data,
    photos: photos.data ?? [],
    stats: {
      likesSent: sent.count ?? 0,
      likesReceived: received.count ?? 0,
      matches: matches.count ?? 0,
      reports: reports.count ?? 0,
    },
  });
}