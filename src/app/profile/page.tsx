"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import AdBanner from "@/components/ads/AdBanner";
import { getToken } from "@/lib/supabase/client";

type CheckState = "checking" | "admin" | "user" | "unconfigured";

export default function ProfilePage() {
  const [state, setState] = useState<CheckState>("checking");

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch("/api/admin/check", {
          headers: { Authorization: `Bearer ${getToken() ?? ""}` },
        });
        const data = (await res.json()) as { isAdmin?: boolean; configured?: boolean };
        if (!active) return;
        if (!data.configured) setState("unconfigured");
        else if (data.isAdmin) setState("admin");
        else setState("user");
      } catch {
        if (active) setState("user");
      }
    }
    check();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-24">
      <p className="text-lg font-bold text-ink">My Profile 👤</p>
      <p className="text-sm text-muted">Profile editing & photos arrive in Phase 6.</p>

      {state === "checking" && (
        <p className="text-xs text-muted">Checking admin rights…</p>
      )}

      {state === "admin" && (
        <Link
          href="/admin"
          className="flex items-center justify-center gap-2 rounded-xl bg-pink-500 p-3 text-sm font-bold text-white"
        >
          <ShieldCheck className="h-4 w-4" /> Admin Dashboard
        </Link>
      )}

      {state === "unconfigured" && (
        <p className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-xs text-muted">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
          Admin IDs not configured on the server (ADMIN_TELEGRAM_IDS missing).
        </p>
      )}

      <AdBanner placement="profile" />
    </main>
  );
}