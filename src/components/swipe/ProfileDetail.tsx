"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, Heart, MapPin, Search, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils/helpers";
import type { ProfilePhoto, ProfileWithPhotos, SwipeAction } from "@/types";

const GENDER_LABEL: Record<string, string> = {
  female: "Woman",
  male: "Man",
  other: "Non-binary",
};
const LOOKING_LABEL: Record<string, string> = {
  male: "Men",
  female: "Women",
  everyone: "Everyone",
};

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
        .from("profile_photos")
        .select("*")
        .eq("user_id", profile?.id ?? "")
        .eq("moderation_status", "approved")
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });
      if (active) {
        setPhotos((data ?? []) as ProfilePhoto[]);
        setPhotoIndex(0);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [profile]);

  if (!profile) return null;

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setPhotoIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app">
      {/* Swipeable photo gallery */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto"
        >
          {photos.map((p) => (
            <img
              key={p.id}
              src={p.photo_url}
              alt={profile.first_name}
              draggable={false}
              className="h-[420px] w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Back to deck"
          onClick={onClose}
          className="absolute left-3 top-3 rounded-full bg-black/50 p-2 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          {photos.map((p, i) => (
            <span
              key={p.id}
              className={`h-1.5 rounded-full ${i === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-ink">
            {profile.first_name}, {profile.age}
          </h2>
          {profile.is_verified && <BadgeCheck className="h-5 w-5 text-sky-500" />}
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5" /> {profile.city}, {profile.country}
        </p>
        <p className="mt-1 text-xs text-muted">Active {timeAgo(profile.last_active_at)}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-line bg-surface p-3">
            <p className="text-xs text-muted">I am</p>
            <p className="font-semibold text-ink">
              {GENDER_LABEL[profile.gender] ?? profile.gender}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-3">
            <p className="flex items-center gap-1 text-xs text-muted">
              <Search className="h-3 w-3" /> Looking for
            </p>
            <p className="font-semibold text-ink">
              {LOOKING_LABEL[profile.interested_in] ?? profile.interested_in}
            </p>
          </div>
        </div>

        {profile.bio && (
          <>
            <h3 className="mt-4 text-sm font-bold text-ink">About</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{profile.bio}</p>
          </>
        )}

        {profile.interests.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-bold text-ink">Interests</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink"
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Decide from the overlay */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-6 border-t border-line bg-surface p-4">
        <button
          type="button"
          aria-label="Pass"
          onClick={() => onAction("pass")}
          className="rounded-full border border-line bg-app p-4 text-red-400 shadow-md"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="Like"
          onClick={() => onAction("like")}
          className="rounded-full border border-line bg-app p-4 text-pink-500 shadow-md"
        >
          <Heart className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}