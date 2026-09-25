"use client";
import { usePathname } from "next/navigation";
import HelpFab from "@/components/support/HelpFab";
import NavGate from "@/components/layout/NavGate";
import { useHeartbeat } from "@/lib/realtime/useHeartbeat";

/** Floating help + bottom nav (hidden on admin/landing/ads) + presence heartbeat. */
export default function LayoutChrome() {
  const pathname = usePathname();
  useHeartbeat();

  const hidden =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/landing") ||
    pathname?.startsWith("/ads");

  if (hidden) return null;
  return (
    <>
      <HelpFab />
      <NavGate />
    </>
  );
}