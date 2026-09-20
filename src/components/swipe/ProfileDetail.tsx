"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, Heart, MapPin, Search, X } from "lucide-react";
import PremiumBadge from "@/components/ui/PremiumBadge";
import { getSupabase } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils/helpers";
import { INTEREST_GROUPS, PROFILE_CATEGORIES } from "@/lib/utils/constants";
import type { ProfilePhoto, ProfileWithPhotos, SwipeAction } from "@/types";

const GENDER_LABEL: Record<string, string> = { female: "Woman", male: "Man", other: "Non-binary" };
const LOOKING_LABEL: Record<string, string> = { male: "Men", female: "Women", everyone: "Everyone" };

interface Props {
  profile: ProfileWithPhotos | null;
  onClose: () => void;
  onAction: (action: SwipeAction) => void;
}

export default function ProfileDetail({ profile, onClose, onAction }: Props) {
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    async function load() {
      const { data } = await getSupabase()
        .from("profile_photos").select("*")
        .eq("user_id", profile?.id ?? "")
        .eq("moderation_status", "approved")
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });
      if (active) { setPhotos((data ?? []) as ProfilePhoto[]); setPhotoIndex(0); }
    }
    void load();
    return () => { active = false; };
  }, [profile]);

  if (!profile) return null;

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setPhotoIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  const filledCats = PROFILE_CATEGORIES.filter((c) => profile[c.key]);
  const ungrouped = profile.interests.filter(
    (t) => !INTEREST_GROUPS.some((g) => g.tags.includes(t))
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app">
      {/* Compact gallery — half the old height */}
      <div className="relative px-3 pt-3">
        <div ref={scrollRef} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl">
          {photos.map((p) => (
            <img key={p.id} src={p.photo_url} alt={profile.first_name} draggable={false}
              className="h-[210px] w-full shrink-0 snap-center rounded-2xl object-cover" />
          ))}
        </div>
        <button type="button" aria-label="Back to deck" onClick={onClose}
          className="absolute left-5 top-5 rounded-full bg-black/50 p-1.5 text-white">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          {photos.map((p, i) => (
            <span key={p.id} className={`h-1 rounded-full ${i === photoIndex ? "w-3 bg-white" : "w-1 bg-white/50"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xl font-bold text-ink">{profile.first_name}, {profile.age}</h2>
          {profile.is_premium && <PremiumBadge />}
          {profile.is_verified && <BadgeCheck className="h-4 w-4 text-sky-500" />}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3" /> {profile.city}{profile.country ? `, ${profile.country}` : ""} · Active {timeAgo(profile.last_active_at)}
        </p>
        {profile.height_cm && <p className="mt-0.5 text-xs text-muted">📏 {profile.height_cm} cm</p>}

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-line bg-surface p-2.5">
            <p className="text-[11px] text-muted">I am</p>
            <p className="text-xs font-semibold text-ink">{GENDER_LABEL[profile.gender] ?? profile.gender}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-2.5">
            <p className="flex items-center gap-1 text-[11px] text-muted"><Search className="h-3 w-3" /> Looking for</p>
            <p className="text-xs font-semibold text-ink">{LOOKING_LABEL[profile.interested_in] ?? profile.interested_in}</p>
          </div>
        </div>

        {profile.bio && (
          <>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">About</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{profile.bio}</p>
          </>
        )}

        {profile.occupation && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2">
            <span className="text-xs text-muted">💼 Work</span>
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-semibold text-ink">{profile.occupation}</span>
          </div>
        )}

        {filledCats.length > 0 && (
          <>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">The details</h3>
            <div className="mt-2 flex flex-col gap-1.5">
              {filledCats.map((c) => (
                <div key={c.key} className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2">
                  <span className="text-xs text-muted">{c.emoji} {c.label}</span>
                  <span className="rounded-full bg-field px-2.5 py-1 text-xs font-semibold text-ink">{profile[c.key]}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {profile.interests.length > 0 && (
          <>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">Hobbies & Interests</h3>
            <div className="mt-2 flex flex-col gap-3">
              {INTEREST_GROUPS.map((g) => {
                const tags = profile.interests.filter((t) => g.tags.includes(t));
                if (tags.length === 0) return null;
                return (
                  <div key={g.group}>
                    <p className="mb-1.5 text-xs font-semibold text-ink">{g.emoji} {g.group}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span key={t} className="rounded-full bg-pink-500/15 px-2.5 py-1 text-[11px] font-medium text-pink-500">{t}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {ungrouped.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ungrouped.map((t) => (
                    <span key={t} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sleek thin action bar with tiny buttons */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-5 border-t border-line bg-surface/95 px-4 py-2 backdrop-blur">
        <button type="button" aria-label="Pass" onClick={() => onAction("pass")}
          className="rounded-full border border-line bg-app p-2.5 text-red-400">
          <X className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Like" onClick={() => onAction("like")}
          className="rounded-full border border-line bg-app p-2.5 text-pink-500">
          <Heart className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}