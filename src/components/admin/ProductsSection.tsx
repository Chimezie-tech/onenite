"use client";
import { useState } from "react";
import { getToken } from "@/lib/supabase/client";
import AutoGrowTextarea from "@/components/ui/AutoGrowTextarea";
import ImageUploadField from "@/components/admin/ImageUploadField";

const FIELD = "w-full rounded-lg border border-line bg-field p-2 text-sm text-ink";

export default function ProductsSection() {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [thumb, setThumb] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [cta, setCta] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [shipping, setShipping] = useState(false);
  const [colors, setColors] = useState("");

  function clearForm() {
    setName("");
    setPrice("");
    setThumb(null);
    setImages([]);
    setCta("");
    setDesc("");
    setLocation("");
    setShipping(false);
    setColors("");
  }

  async function post() {
    setBusy(true);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken() ?? ""}`,
      },
      body: JSON.stringify({
        name,
        price: Number(price),
        image_url: thumb ?? images[0] ?? "",
        thumbnail_url: thumb,
        images,
        description: desc || null,
        location: location || null,
        shipping_available: shipping,
        colors: colors.split(",").map((c) => c.trim()).filter(Boolean),
        cta_url: cta || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      alert(`Failed: ${err.error ?? res.status}`);
      return;
    }
    alert("Product posted ✅");
    clearForm();
  }

  return (
    <section className="flex max-w-lg flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <h2 className="font-semibold text-ink">New Product</h2>
      <input className={FIELD} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={FIELD} placeholder="Price (e.g. 1500)" value={price} onChange={(e) => setPrice(e.target.value)} />
      <ImageUploadField label="thumbnail" value={thumb} onChange={setThumb} />
      <div className="flex flex-col gap-2 rounded-lg border border-line p-2">
        <p className="text-xs text-muted">Gallery ({images.length}/6)</p>
        {images.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <img src={url} alt="" className="h-8 w-8 rounded object-cover" />
            <button type="button" className="text-xs text-red-400"
              onClick={() => setImages(images.filter((_, x) => x !== i))}>Remove</button>
          </div>
        ))}
        {images.length < 6 && (
          <ImageUploadField
            label={`image ${images.length + 1}`}
            value={null}
            onChange={(url) => setImages([...images, url])}
          />
        )}
      </div>
      <AutoGrowTextarea value={desc} onChange={setDesc} placeholder="Description (expands as you type)…" className={FIELD} />
      <input className={FIELD} placeholder="Location (e.g. Lagos Island)" value={location} onChange={(e) => setLocation(e.target.value)} />
      <input className={FIELD} placeholder="Colors as hex, comma-separated (#e11d48, #0ea5e9)" value={colors} onChange={(e) => setColors(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={shipping} onChange={(e) => setShipping(e.target.checked)} />
        Shipping available
      </label>
      <input className={FIELD} placeholder="Checkout URL (optional)" value={cta} onChange={(e) => setCta(e.target.value)} />
      <button type="button" disabled={busy || !name || !price} onClick={() => void post()}
        className="rounded-lg bg-pink-500 py-2 text-sm font-bold text-white disabled:opacity-50">
        {busy ? "Posting…" : "Post Product"}
      </button>
    </section>
  );
}