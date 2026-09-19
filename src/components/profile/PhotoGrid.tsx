"use client";
import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import type { ProfilePhoto } from "@/types";

interface Props {
  photos: ProfilePhoto[];
  onChange: (photos: ProfilePhoto[]) => void;
}

export default function PhotoGrid({ photos, onChange }: Props) {
  const [busyId, setBusyId] = useState("");

  async function setPrimary(photo: ProfilePhoto) {
    setBusyId(photo.id);
    for (const p of photos.filter((x) => x.is_primary && x.id !== photo.id)) {
      await getSupabase().from("profile_photos").update({ is_primary: false }).eq("id", p.id);
    }
    await getSupabase().from("profile_photos").update({ is_primary: true }).eq("id", photo.id);
    onChange(photos.map((p) => ({ ...p, is_primary: p.id === photo.id })));
    setBusyId("");
  }

  async function remove(photo: ProfilePhoto) {
    if (!window.confirm("Delete this photo?")) return;
    setBusyId(photo.id);
    await getSupabase().from("profile_photos").delete().eq("id", photo.id);
    const path = new URL(photo.photo_url).pathname.split("/profile-photos/")[1];
    if (path) await getSupabase().storage.from("profile-photos").remove([path]);

    let next = photos.filter((p) => p.id !== photo.id);
    if (photo.is_primary && next.length > 0) {
      await getSupabase().from("profile_photos").update({ is_primary: true }).eq("id", next[0].id);
      next = next.map((p, i) => ({ ...p, is_primary: i === 0 }));
    }
    onChange(next);
    setBusyId("");
  }

  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <div key={photo.id} className="relative overflow-hidden rounded-xl border border-line">
          <img src={photo.photo_url} alt="Profile" className="h-28 w-full object-cover" />

          {photo.moderation_status === "pending" && (
            <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Reviewing
            </span>
          )}
          {photo.moderation_status === "rejected" && (
            <span className="absolute inset-x-0 bottom-0 bg-red-600/90 px-1 py-0.5 text-[10px] font-bold text-white" title={photo.moderation_reason ?? ""}>
              Rejected: {photo.moderation_reason ?? "policy"}
            </span>
          )}
          {photo.is_primary && photo.moderation_status === "approved" && (
            <span className="absolute left-1 top-1 rounded bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Main
            </span>
          )}

          <div className="absolute right-1 top-1 flex gap-1">
            {!photo.is_primary && (
              <button
                type="button"
                aria-label="Make main photo"
                disabled={busyId === photo.id}
                onClick={() => setPrimary(photo)}
                className="rounded-full bg-black/60 p-1 text-white"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              aria-label="Delete photo"
              disabled={busyId === photo.id}
              onClick={() => remove(photo)}
              className="rounded-full bg-black/60 p-1 text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}