"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";

/** Any onboarded user missing a city is routed back to onboarding until it's set. */
export default function CityGate() {
  const { profile } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!profile) return;
    if (profile.onboarding_completed && !profile.city && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [profile, pathname, router]);

  return null;
}