import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import type { Profile } from "@/types";

let adminClient: SupabaseClient | null = null;

/** Service-role client. Bypasses RLS. SERVER ONLY. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return adminClient;
}

export function isAdminTelegramId(telegramId: number): boolean {
  const raw = process.env.ADMIN_TELEGRAM_IDS ?? "";
  return raw.split(",").map((s) => s.trim()).includes(String(telegramId));
}

/** Verifies the caller's JWT and confirms they are an admin. Returns profile or null. */
export async function requireAdmin(req: Request): Promise<Profile | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as { sub?: string };
    if (!payload.sub) return null;
    const { data } = await getSupabaseAdmin()
      .from("profiles").select("*").eq("id", payload.sub).maybeSingle();
    if (!data) return null;
    return isAdminTelegramId(data.telegram_id) ? (data as Profile) : null;
  } catch {
    return null;
  }
}