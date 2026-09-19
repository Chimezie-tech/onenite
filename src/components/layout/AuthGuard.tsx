"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { supabase, loginWithTelegram } from "@/lib/supabase/client";
import { getInitData, expandApp } from "@/lib/telegram/sdk";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { profile, setProfile, isLoading, setLoading } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState("");

  useEffect(() => {
    expandApp(); // Make Telegram Mini App full screen

    async function initAuth() {
      // 1. Check if already logged in (Supabase session exists)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Fetch profile if we have a session but no profile in store
        if (!profile) {
           const { data } = await supabase.from("profiles").select("*").single();
           if (data) setProfile(data);
        }
        setLoading(false);
        return;
      }

      // 2. Not logged in. Try Telegram Login.
      const initData = getInitData();
      if (!initData) {
        setError("Please open this app inside Telegram.");
        setLoading(false);
        return;
      }

      try {
        const userProfile = await loginWithTelegram(initData);
        setProfile(userProfile);
        
        // 3. Route based on onboarding status
        if (!userProfile.onboarding_completed && pathname !== "/onboarding") {
          router.replace("/onboarding");
        }
      } catch (err) {
        setError("Failed to authenticate. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin w-8 h-8" />
        <span className="ml-2">Loading OneNite...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  return <>{children}</>;
}