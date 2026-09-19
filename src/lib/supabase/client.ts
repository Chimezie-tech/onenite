import { createBrowserClient } from "@supabase/ssr"; // Wait, let's use the simpler standard client for mini apps
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function loginWithTelegram(initData: string) {
  // 1. Call our backend to verify hash and get the JWT
  const res = await fetch("/api/auth/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });

  if (!res.ok) throw new Error("Authentication failed");
  
  const { token, profile } = await res.json();

  // 2. Tell the Supabase client to use this JWT
  await supabase.auth.setSession({
    access_token: token,
    refresh_token: token,
  });

  return profile;
}