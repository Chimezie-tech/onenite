"use client";
import { useState } from "react";
import { getToken } from "@/lib/supabase/client";
import ImageUploadField from "@/components/admin/ImageUploadField";

const FIELD = "w-full rounded-lg border border-line bg-field p-2 text-sm text-ink";

export default function AdsSection() {
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaType, setCtaType] = useState<"internal" | "external">("external");
  const [placements, setPlacements] = useState<string[]>(["home"]);

  function clearForm() {
    setTitle("");
    setImage(null);
    setCtaUrl("");
    setCtaType("external");
    setPlacements(["home"]);
  }

  function togglePlacement(p: string) {
    setPlacements((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function post() {
    setBusy(true);
    const res = await fetch("/api/admin/ads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken() ?? ""}`,
      },
      body: JSON.stringify({
        title,
        image_url: image ?? "",
        cta_type: ctaType,
        cta_url: ctaUrl,
        placements,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      alert(`Failed: ${err.error ?? res.status}`);
      return;
    }
    alert("Ad posted ✅");
    clearForm();
  }

  return (
    <section className="flex max-w-lg flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <h2 className="font-semibold text-ink">New Ad</h2>
      <input className={FIELD} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <ImageUploadField label="ad image" value={image} onChange={setImage} />
      <select className={FIELD} value={ctaType}
        onChange={(e) => setCtaType(e.target.value === "internal" ? "internal" : "external")}>
        <option value="external">External URL</option>
        <option value="internal">Internal page (e.g. /premium)</option>
      </select>
      <input className={FIELD} placeholder="CTA destination (URL or /path)" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
      <div className="flex gap-3 text-sm text-ink">
        {["home", "chat", "profile"].map((p) => (
          <label key={p} className="flex items-center gap-1">
            <input type="checkbox" checked={placements.includes(p)} onChange={() => togglePlacement(p)} />
            {p}
          </label>
        ))}
      </div>
      <button type="button" disabled={busy || !title || !image} onClick={() => void post()}
        className="rounded-lg bg-pink-500 py-2 text-sm font-bold text-white disabled:opacity-50">
        {busy ? "Posting…" : "Post Ad"}
      </button>
    </section>
  );
}