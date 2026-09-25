"use client";
import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Pings last_active_at every 60s while the app is open.
 * This is what makes the green "Online" dot truthful.
 */
export function useHeartbeat(intervalMs = 60_000) {
  useEffect(() => {
    let active = true;

    async function touch() {
      try {
        // Fire-and-forget; silently no-ops when logged out (auth.uid() = null)
        await getSupabase().rpc("touch_active");
      } catch {
        // Network blips must never surface to the user
      }
    }

    void touch();
    const timer = setInterval(() => {
      if (active) void touch();
    }, intervalMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [intervalMs]);
}