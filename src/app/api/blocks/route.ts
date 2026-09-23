import { NextResponse } from "next/server";
import { requireUser, getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blockedId } = (await req.json()) as { blockedId?: string };
  if (!blockedId || blockedId === user.id) return NextResponse.json({ ok: true });

  const { error } = await getSupabaseAdmin()
    .from("blocks").insert({ blocker_id: user.id, blocked_id: blockedId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optional: delete existing matches/likes to clean up
  await getSupabaseAdmin().from("likes").delete().or(`and(from_user_id.eq.${user.id},to_user_id.eq.${blockedId}),and(from_user_id.eq.${blockedId},to_user_id.eq.${user.id})`);
  
  return NextResponse.json({ ok: true });
}