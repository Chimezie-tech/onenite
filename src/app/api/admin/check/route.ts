import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const configured = (process.env.ADMIN_TELEGRAM_IDS ?? "").trim().length > 0;
  const admin = await requireAdmin(req);
  return NextResponse.json({ isAdmin: admin !== null, configured });
}