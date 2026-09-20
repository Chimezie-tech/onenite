"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Share2 } from "lucide-react";
import AdBanner from "@/components/ads/AdBanner";
import PhotoGrid from "@/components/profile/PhotoGrid";
import PhotoUploader from "@/components/profile/PhotoUploader";
import { getToken, getSupabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { getTelegramWebApp } from "@/lib/telegram/sdk";
import { profileScore } from "@/lib/utils/profileScore";
import type { ProfilePhoto } from "@/types";

type CheckState = "checking" | "admin" | "user" | "unconfigured";

export default function ProfilePage() {
  const { profile } = useUserStore();
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [state, setState] = useState<CheckState>("checking");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!profile) return;
      const { data } = await getSupabase()
        .from("profile_photos")
        .select("*")
        .eq("user_id", profile.id)
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
    void load();
    void check();
    return () => {
      active = false;
    };
  }, [profile]);

  function inviteFriends() {
    const tg = getTelegramWebApp();
    if (!profile?.referral_code) return;
    const link = `https://t.me/OneNite_bot/app?startapp=ref_${profile.referral_code}`;
    const text = encodeURIComponent("Join me on OneNite! ❤️");
    const url = encodeURIComponent(link);
    if (tg) tg.openTelegramLink(`https://t.me/share/url?url=${url}&text=${text}`);
    else window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-24">
      <p className="text-lg font-bold text-ink">My Profile</p>
      <p className="text-xs text-muted">
        Profile strength:{" "}
        {profile
          ? profileScore(profile, photos.filter((p) => p.moderation_status === "approved").length)
          : 0}
        %
      </p>

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

      <button
        type="button"
        onClick={inviteFriends}
        className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm font-semibold text-ink"
      >
        <Share2 className="h-4 w-4" /> Invite Friends (+1 Like each)
      </button>
      {profile && profile.bonus_likes > 0 && (
        <p className="text-center text-xs font-semibold text-pink-500">
          🎁 {profile.bonus_likes} bonus likes ready to use!
        </p>
      )}

      <AdBanner placement="profile" />
      <p className="text-center text-xs text-muted">
        {profile?.city} • {profile?.age}
      </p>
    </main>
  );
}