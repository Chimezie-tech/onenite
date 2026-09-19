import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { moderatePhoto } from "@/lib/ai/moderate-photo";

export async function POST(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let sub: string | null = null;
  try {
    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as { sub?: string };
    sub = payload.sub ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  if (!sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { photoId } = (await req.json()) as { photoId?: string };
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: photo } = await admin
    .from("profile_photos").select("*").eq("id", photoId).maybeSingle();
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (photo.user_id !== sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await moderatePhoto(photo.photo_url, photo.mime_type);

  const status = result.serviceError
    ? "pending"                                   // infra problem → keep retryable
    : result.safe
      ? "approved"
      : "rejected";                               // AI verdict only

  await admin
    .from("profile_photos")
    .update({
      moderation_status: status,
      moderation_reason: result.serviceError ? null : result.reason,
    })
    .eq("id", photoId);

  return NextResponse.json({
    status,
    reason: result.reason,
    serviceError: result.serviceError,
  });
}