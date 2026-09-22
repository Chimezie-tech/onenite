"use client";
import { useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

interface Props {
  label: string;
  value: string | null;
  onChange: (url: string) => void;
}

export default function ImageUploadField({ label, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const path = `admin/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await getSupabase().storage
      .from("onenite-media").upload(path, file);
    setUploading(false);
    if (error) { alert(`Upload failed: ${error.message}`); return; }
    const { data } = getSupabase().storage.from("onenite-media").getPublicUrl(path);
    onChange(data.publicUrl);
  }

  return (
    <div className="flex items-center gap-2">
      {value && <img src={value} alt="" className="h-10 w-10 rounded-lg object-cover" />}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink"
      >
        {uploading ? "Uploading…" : value ? `Replace ${label}` : `Upload ${label} 📁`}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
      />
    </div>
  );
}