"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import AdBanner from "@/components/ads/AdBanner";
import { getToken } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/admin/check", {
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      });
      const data = (await res.json()) as { isAdmin?: boolean };
      setIsAdmin(Boolean(data.isAdmin));
    }
    check();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-24">
      <p className="text-lg font-bold text-ink">My Profile 👤</p>
      <p className="text-sm text-muted">Profile editing & photos arrive in Phase 6.</p>

      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm font-semibold text-pink-500"
        >
          <ShieldCheck className="h-4 w-4" /> Admin Console
        </Link>
      )}

      <AdBanner placement="profile" />
    </main>
  );
}