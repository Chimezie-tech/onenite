"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/layout/AuthGuard";

/** Routes that must be viewable by anyone, outside Telegram, with no auth. */
const PUBLIC_PREFIXES = ["/landing"];

export default function AppGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname?.startsWith(p));

  if (isPublic) return <>{children}</>;
  return <AuthGuard>{children}</AuthGuard>;
}