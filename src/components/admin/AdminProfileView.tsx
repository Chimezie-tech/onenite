"use client";
import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getToken } from "@/lib/supabase/client";
import { PROFILE_CATEGORIES } from "@/lib/utils/constants";
import type { Profile, ProfilePhoto } from "@/types";

interface Stats { likesSent: number; likesReceived: number; matches: number; reports: number; }

export default function AdminProfileView({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await fetch(`/api/admin/users/detail?id=${userId}`, {
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      });
      if (!active) return;
      if (!res.ok) { setState("error"); return; }
      const data = (await res.json()) as { profile: Profile; photos: ProfilePhoto[]; stats: Stats };
      if (!active) return;
      setProfile(data.profile);
      setPhotos(data.photos);
      setStats(data.stats);
      setState("ready");
    })();
    return () => { active = false; };
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-4">
        {state === "loading" && (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
          </div>
        )}

        {state === "error" && (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-red-400">Could not load this profile.</p>
            <p className="mt-1 text-xs text-muted">Check that /api/admin/users/detail exists and is deployed.</p>
            <button type="button" onClick={onClose} className="mt-4 rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink">
              Close
            </button>
          </div>
        )}

        {state === "ready" && profile && (
          <>
            <div className="flex items-center justify-between">
              <p className="font-bold text-ink">
                {profile.first_name}, {profile.age} (@{profile.username ?? profile.telegram_id})
              </p>
              <button type="button" aria-label="Close" onClick={onClose} className="text-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto">
              {(photos.length ? photos.map((p) => p.photo_url) : profile.photo_url ? [profile.photo_url] : []).map((url, i) => (
                <img key={i} src={url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              ))}
              {photos.length === 0 && !profile.photo_url && (
                <p className="text-xs text-muted">No photos uploaded</p>
              )}
            </div>

            {stats && (
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {([["Likes sent", stats.likesSent], ["Received", stats.likesReceived], ["Matches", stats.matches], ["Reports", stats.reports]] as Array<[string, number]>).map(([label, v]) => (
                  <div key={label} className="rounded-lg border border-line p-2">
                    <p className="text-sm font-bold text-ink">{v}</p>
                    <p className="text-[10px] text-muted">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between rounded-lg border border-line px-3 py-2">
                <span className="text-muted">City / Country</span>
                <span className="font-semibold text-ink">{profile.city || "—"} / {profile.country || "—"}</span>
              </div>
              <div className="flex justify-between rounded-lg border border-line px-3 py-2">
                <span className="text-muted">I am / Looking for</span>
                <span className="font-semibold text-ink">{profile.gender} / {profile.interested_in}</span>
              </div>
              <div className="flex justify-between rounded-lg border border-line px-3 py-2">
                <span className="text-muted">Premium until</span>
                <span className="font-semibold text-ink">{profile.premium_expires_at ? new Date(profile.premium_expires_at).toDateString() : "—"}</span>
              </div>
              <div className="flex justify-between rounded-lg border border-line px-3 py-2">
                <span className="text-muted">Onboarding</span>
                <span className="font-semibold text-ink">{profile.onboarding_completed ? "Complete" : "Incomplete ⚠️"}</span>
              </div>
              {profile.occupation && (
                <div className="flex justify-between rounded-lg border border-line px-3 py-2">
                  <span className="text-muted">Work</span><span className="font-semibold text-ink">{profile.occupation}</span>
                </div>
              )}
              {PROFILE_CATEGORIES.filter((c) => profile[c.key]).map((c) => (
                <div key={c.key} className="flex justify-between rounded-lg border border-line px-3 py-2">
                  <span className="text-muted">{c.emoji} {c.label}</span>
                  <span className="font-semibold text-ink">{profile[c.key]}</span>
                </div>
              ))}
              {profile.interests.length > 0 && (
                <div className="rounded-lg border border-line px-3 py-2">
                  <span className="text-muted">Interests: </span>
                  <span className="font-semibold text-ink">{profile.interests.join(", ")}</span>
                </div>
              )}
              {profile.bio && (
                <div className="rounded-lg border border-line px-3 py-2">
                  <p className="text-muted">Bio</p>
                  <p className="mt-1 whitespace-pre-wrap font-semibold text-ink">{profile.bio}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}