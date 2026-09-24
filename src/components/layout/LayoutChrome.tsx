"use client";
import { usePathname } from "next/navigation";
import HelpFab from "@/components/support/HelpFab";
import NavGate from "@/components/layout/NavGate";

/** Floating help button + bottom nav — hidden on admin and public landing pages. */
export default function LayoutChrome() {
  const pathname = usePathname();
  const hidden =
    pathname?.startsWith("/admin") || pathname?.startsWith("/landing");

  if (hidden) return null;
  return (
    <>
      <HelpFab />
      <NavGate />
    </>
  );
}