import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types";

const TOKEN_KEY = "onenite:token";
const PROFILE_KEY = "onenite:profile";

let cachedClient: SupabaseClient | null = null;
let cachedToken: string | null = null;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
  cachedClient = null;
  cachedToken = null;
}

function saveSession(token: string, profile: Profile): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  cachedClient = null;
  cachedToken = null;
}

/**
 * Supabase client authenticated with our custom Telegram JWT sent
 * via the Authorization header on EVERY request.
 * Deterministic: no session manager, no refresh magic, no auth.users lookups.
 */
export function getSupabase(): SupabaseClient {
  const token = getToken();
  if (cachedClient && cachedToken === token) return cachedClient;
  cachedToken = token;
  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    }
  );
    if (token) {
    // Realtime (chat) subscriptions need the user token for RLS filtering
    cachedClient.realtime.setAuth(token);
  }
  return cachedClient;
}

export async function loginWithTelegram(initData: string): Promise<Profile> {
  const res = await fetch("/api/auth/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  const data: { token?: string; profile?: Profile; error?: string } = await res
    .json()
    .catch(() => ({}));
  if (!res.ok || !data.token || !data.profile) {
    throw new Error(data.error ?? `Authentication failed (HTTP ${res.status})`);
  }
  saveSession(data.token, data.profile);
  return data.profile;
}