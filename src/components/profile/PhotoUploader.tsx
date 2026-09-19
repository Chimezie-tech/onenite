"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { getSupabase, getToken } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { MAX_PHOTOS, MAX_UPLOAD_MB, ALLOWED_IMAGE_TYPES } from "@/lib/utils/constants";
import type { ProfilePhoto } from "@/types";

interface Props {
  photoCount: number;
  onUploaded: (photo: ProfilePhoto) => void;
}

export default function PhotoUploader({ photoCount, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { profile } = useUserStore();

  async function handleFile(file: File) {
    setError("");
    if (!profile) return;
    if (photoCount >= MAX_PHOTOS) { setError(`Maximum ${MAX_PHOTOS} photos.`); return; }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { setError("Use JPG, PNG or WebP."); return; }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) { setError(`Max size is ${MAX_UPLOAD_MB}MB.`); return; }

    setBusy(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await getSupabase()
        .storage.from("profile-photos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = getSupabase().storage.from("profile-photos").getPublicUrl(path);

      const { data: row, error: insertError } = await getSupabase()
        .from("profile_photos")
        .insert({
          user_id: profile.id,
          photo_url: urlData.publicUrl,
          is_primary: photoCount === 0,
          mime_type: file.type,
        })
        .select()
        .single();
      if (insertError || !row) throw insertError ?? new Error("Could not save photo");

      // AI moderation (server-side, key stays secret)
      await fetch("/api/moderate/photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken() ?? ""}`,
        },
        body: JSON.stringify({ photoId: row.id }),
      });

      const { data: fresh } = await getSupabase()
        .from("profile_photos").select("*").eq("id", row.id).maybeSingle();
      onUploaded((fresh ?? row) as ProfilePhoto);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface p-4 text-sm font-semibold text-ink disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {busy ? "Uploading & checking…" : "Add Photo"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}