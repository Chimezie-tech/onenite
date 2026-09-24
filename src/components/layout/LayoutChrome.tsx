"use client";
import { usePathname } from "next/navigation";
import HelpFab from "@/components/support/HelpFab";
import NavGate from "@/components/layout/NavGate";

/** Floating help + bottom nav — hidden on admin, landing and ad studio routes. */
export default function LayoutChrome() {
  const pathname = usePathname();
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