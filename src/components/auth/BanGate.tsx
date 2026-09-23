"use client";
import type { ReactNode } from "react";
import { useUserStore } from "@/store/useUserStore";
import BanScreen from "@/components/auth/BanScreen";

export default function BanGate({ children }: { children: ReactNode }) {
  const { profile } = useUserStore();
  if (profile?.is_banned) return <BanScreen />;
  return <>{children}</>;
}