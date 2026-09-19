import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  return NextResponse.json({ isAdmin: admin !== null });
}