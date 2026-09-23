"use client";
import { usePathname } from "next/navigation";
import HelpFab from "@/components/support/HelpFab";
import NavGate from "@/components/layout/NavGate";

/**
 * Renders the floating help button and bottom nav,
 * but hides both on the admin dashboard.
 */
export default function LayoutChrome() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) return null;
  return (
    <>
      <HelpFab />
      <NavGate />
    </>
  );
}