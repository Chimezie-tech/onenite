"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import AdCarousel from "@/components/ads/AdCarousel";
import SwipeDeck from "@/components/swipe/SwipeDeck";
import MatchModal from "@/components/swipe/MatchModal";
import PaywallModal from "@/components/swipe/PaywallModal";
import { useUserStore } from "@/store/useUserStore";
import { useDeck } from "@/hooks/useDeck";
import { getSupabase } from "@/lib/supabase/client";
import { haptic } from "@/lib/telegram/sdk";
import ProfileDetail from "@/components/swipe/ProfileDetail";
import {
  FREE_DAILY_LIKES,
  FREE_DAILY_SUPER_LIKES,
  PREMIUM_DAILY_SUPER_LIKES,
} from "@/lib/utils/constants";
import type { ProfileWithPhotos, SwipeAction } from "@/types";

interface Limits {
  likes: number;
  supers: number;
}

export default function Home() {
  const { profile } = useUserStore();
  const { deck, loading, removeCard, reload } = useDeck(profile);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [hasPhotos, setHasPhotos] = useState(true);
  const [myPhotoUrl, setMyPhotoUrl] = useState<string | null>(null);
  const [matchWith, setMatchWith] = useState<ProfileWithPhotos | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<ProfileWithPhotos | null>(null);

  useEffect(() => {
    if (!profile) return;
    const today = new Date().toISOString().slice(0, 10);
    async function loadMeta() {
      if (!profile) return;
      const { data: lim } = await getSupabase()
        .from("daily_limits").select("*")
        .eq("user_id", profile.id).eq("limit_date", today).maybeSingle();
      setLimits({
        likes: profile.is_premium ? 9999 : FREE_DAILY_LIKES - (lim?.likes_used ?? 0),
        supers: profile.is_premium
          ? PREMIUM_DAILY_SUPER_LIKES - (lim?.super_likes_used ?? 0)
          : FREE_DAILY_SUPER_LIKES - (lim?.super_likes_used ?? 0),
      });

      const { data: photos } = await getSupabase()
        .from("profile_photos")
        .select("photo_url, is_primary")
        .eq("user_id", profile.id)
        .eq("moderation_status", "approved");
      const list = photos ?? [];
      setHasPhotos(list.length > 0);
      setMyPhotoUrl((list.find((p) => p.is_primary) ?? list[0])?.photo_url ?? profile.photo_url);
    }
    void loadMeta();
  }, [profile]);

  async function handleAction(target: ProfileWithPhotos, action: SwipeAction) {
    if (!profile) return;

    // Client-side UX guard (server trigger remains the source of truth)
    if (action === "like" && !profile.is_premium && limits && limits.likes <= 0) {
      setShowPaywall(true);
      return;
    }
    if (action === "super" && !profile.is_premium && limits && limits.supers <= 0) {
      setNotice("No super likes left today 💫");
      return;
    }

    const { error } = await getSupabase().from("likes").insert({
      from_user_id: profile.id,
      to_user_id: target.id,
      is_super: action === "super",
      is_pass: action === "pass",
    });

    if (error) {
      if (error.message.includes("DAILY_LIKE_LIMIT")) setShowPaywall(true);
      else if (error.message.includes("SUPER_LIKE_LIMIT")) setNotice("No super likes left today 💫");
      else console.error(error);
      return;
    }

    if (action === "pass") return;

    setLimits((prev) =>
      prev
        ? {
            likes: action === "like" ? Math.max(0, prev.likes - 1) : prev.likes,
            supers: action === "super" ? Math.max(0, prev.supers - 1) : prev.supers,
          }
        : prev
    );
    haptic(action === "super" ? "heavy" : "medium");

    // Did the DB trigger create a match?
    const [a, b] = [profile.id, target.id].sort();
    const { data: matchRow } = await getSupabase()
      .from("matches").select("*")
      .eq("user1_id", a).eq("user2_id", b).maybeSingle();
    if (matchRow) {
      haptic("heavy");
      setMatchWith(target);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-3 p-4 pb-24">
      <ThemeToggle />
      <AdCarousel />

      {!hasPhotos && (
        <Link
          href="/profile"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-center text-xs font-semibold text-amber-500"
        >
          📸 Add an approved photo to start getting matches
        </Link>
      )}

      {notice && (
        <p className="rounded-lg border border-line bg-surface p-2 text-center text-xs text-ink">
          {notice}
        </p>
      )}

      {limits && (
        <div className="flex justify-center gap-3 text-xs font-semibold text-muted">
          <span className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1">
            <Heart className="h-3 w-3 text-pink-500" />
            {profile?.is_premium ? "∞" : limits.likes}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1">
            <Star className="h-3 w-3 text-amber-400" />
            {limits.supers}
          </span>
        </div>
      )}

      <SwipeDeck
        deck={deck}
        loading={loading}
        onAction={handleAction}
        onGone={removeCard}
        onRefresh={reload}
        onOpen={setDetail}
      />

      <MatchModal match={matchWith} myPhotoUrl={myPhotoUrl} onClose={() => setMatchWith(null)} />
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
      <ProfileDetail
        profile={detail}
        onClose={() => setDetail(null)}
        onAction={(action) => {
          if (!detail) return;
          const target = detail;
          setDetail(null);
          removeCard(target.id);
          void handleAction(target, action);
        }}
      />
    </main>
  );
}