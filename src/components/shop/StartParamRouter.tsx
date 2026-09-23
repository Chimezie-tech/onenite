"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTelegramWebApp } from "@/lib/telegram/sdk";

/** Routes t.me/OneNite_bot/app?startapp=p_<productId> straight to that product. */
export default function StartParamRouter() {
  const router = useRouter();

  useEffect(() => {
    const param = getTelegramWebApp()?.initDataUnsafe?.start_param;
    if (!param) return;
    if (param.startsWith("p_")) {
      router.replace(`/shop/${param.slice(2)}`);
    }
  }, [router]);

  return null;
}