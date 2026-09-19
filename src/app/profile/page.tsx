"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import AdBanner from "@/components/ads/AdBanner";
import PhotoGrid from "@/components/profile/PhotoGrid";
import PhotoUploader from "@/components/profile/PhotoUploader";
import { getToken, getSupabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import type { ProfilePhoto } from "@/types";

type CheckState = "checking" | "admin" | "user" | "unconfigured";

export default function ProfilePage() {
  const { profile } = useUserStore();
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [state, setState] = useState<CheckState>("checking");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await getSupabase()
        .from("profile_photos").select("*")
        .order("created_at", { ascending: true });
      if (active) setPhotos((data ?? []) as ProfilePhoto[]);
    }
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
    load();
    check();
    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-24">
      <p className="text-lg font-bold text-ink">My Profile 👤</p>

      <PhotoGrid photos={photos} onChange={setPhotos} />
      <PhotoUploader
        photoCount={photos.length}
        onUploaded={(photo) => setPhotos((prev) => [...prev.filter((p) => p.id !== photo.id), photo])}
      />
      <p className="text-xs text-muted">
        Photos are AI-checked for safety. Rejected photos are only visible to you.
      </p>

      {state === "checking" && <p className="text-xs text-muted">Checking admin rights…</p>}
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
      <p className="text-center text-xs text-muted">{profile?.city} • {profile?.age}</p>
    </main>
  );
}