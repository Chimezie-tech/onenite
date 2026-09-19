"use client";
import { usePathname } from "next/navigation";
import BottomNav, { TAB_ROUTES } from "@/components/layout/BottomNav";

export default function NavGate() {
  const pathname = usePathname();
  if (!TAB_ROUTES.includes(pathname)) return null;
  return <BottomNav />;
}