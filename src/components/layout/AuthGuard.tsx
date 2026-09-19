"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { getToken, getStoredProfile, clearSession, getSupabase, loginWithTelegram } from "@/lib/supabase/client";
import { getInitData, expandApp, getTelegramWebApp } from "@/lib/telegram/sdk";
import type { Profile } from "@/types";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { setProfile, isLoading, setLoading } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState("");

  useEffect(() => {
    expandApp();

       function routeFor(user: Profile) {
      if (!user.onboarding_completed && pathname !== "/onboarding") {
        router.replace("/onboarding");
        return;
      }
      const startParam = getTelegramWebApp()?.initDataUnsafe?.start_param;
      if (startParam === "admin") {
        router.replace("/admin");
        return;
      }
      if (user.onboarding_completed && pathname === "/onboarding") {
        router.replace("/");
      }
    }

    async function initAuth() {
      // 1) Returning user: validate stored token against the DB
      if (getToken()) {
        const stored = getStoredProfile();
        const { data, error: fetchError } = await getSupabase()
          .from("profiles")
          .select("*")
          .eq("id", stored?.id ?? "")
          .maybeSingle();
        if (!fetchError && data) {
          setProfile(data);
          setLoading(false);
          routeFor(data);
          return;
        }
        clearSession(); // dead token → fall through to fresh Telegram login
      }

      // 2) Fresh login via Telegram
      const initData = getInitData();
      if (!initData) {
        setError("Please open this app inside Telegram.");
        setLoading(false);
        return;
      }
      try {
        const user = await loginWithTelegram(initData);
        setProfile(user);
        routeFor(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to authenticate.");
      } finally {
        setLoading(false);
      }
    }

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-app text-ink">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading OneNite...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-app p-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  return <>{children}</>;
}