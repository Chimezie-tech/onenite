"use client";
import { useState } from "react";
import { getToken } from "@/lib/supabase/client";
import AutoGrowTextarea from "@/components/ui/AutoGrowTextarea";
import ImageUploadField from "@/components/admin/ImageUploadField";

const FIELD = "w-full rounded-lg border border-line bg-field p-2 text-sm text-ink";

export default function AdsSection() {
  const [busy, setBusy] = useState(false);

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productThumb, setProductThumb] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productCta, setProductCta] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productLocation, setProductLocation] = useState("");
  const [shipping, setShipping] = useState(false);
  const [colors, setColors] = useState("");

  const [adTitle, setAdTitle] = useState("");
  const [adImage, setAdImage] = useState<string | null>(null);
  const [adCtaUrl, setAdCtaUrl] = useState("");
  const [adCtaType, setAdCtaType] = useState<"internal" | "external">("external");
  const [placements, setPlacements] = useState<string[]>(["home"]);

  async function post(endpoint: string, payload: unknown) {
    setBusy(true);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken() ?? ""}`,
      },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      alert(`Failed: ${err.error ?? res.status}`);
      return;
    }
    alert("Posted successfully ✅");
  }

  function togglePlacement(p: string) {
    setPlacements((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  const colorList = colors.split(",").map((c) => c.trim()).filter(Boolean);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
        <h2 className="font-semibold text-ink">New Product</h2>
        <input className={FIELD} placeholder="Name" value={productName} onChange={(e) => setProductName(e.target.value)} />
        <input className={FIELD} placeholder="Price (e.g. 1500)" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} />
        <ImageUploadField label="thumbnail" value={productThumb} onChange={setProductThumb} />
        <div className="flex flex-col gap-2 rounded-lg border border-line p-2">
          <p className="text-xs text-muted">Gallery ({productImages.length}/6)</p>
          {productImages.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <img src={url} alt="" className="h-8 w-8 rounded object-cover" />
              <button type="button" className="text-xs text-red-400"
                onClick={() => setProductImages(productImages.filter((_, x) => x !== i))}>Remove</button>
            </div>
          ))}
          {productImages.length < 6 && (
            <ImageUploadField
              label={`image ${productImages.length + 1}`}
              value={null}
              onChange={(url) => setProductImages([...productImages, url])}
            />
          )}
        </div>
        <AutoGrowTextarea
          value={productDesc}
          onChange={setProductDesc}
          placeholder="Description (expands as you type)…"
          className={FIELD}
        />
        <input className={FIELD} placeholder="Location (e.g. Lagos Island)" value={productLocation} onChange={(e) => setProductLocation(e.target.value)} />
        <input className={FIELD} placeholder="Colors as hex, comma-separated (#e11d48, #0ea5e9)" value={colors} onChange={(e) => setColors(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={shipping} onChange={(e) => setShipping(e.target.checked)} />
          Shipping available
        </label>
        <input className={FIELD} placeholder="Checkout URL (optional)" value={productCta} onChange={(e) => setProductCta(e.target.value)} />
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void post("/api/admin/products", {
              name: productName,
              price: Number(productPrice),
              image_url: productThumb ?? productImages[0] ?? "",
              thumbnail_url: productThumb,
              images: productImages,
              description: productDesc || null,
              location: productLocation || null,
              shipping_available: shipping,
              colors: colorList,
              cta_url: productCta || null,
            })
          }
          className="rounded-lg bg-pink-500 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Post Product
        </button>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
        <h2 className="font-semibold text-ink">New Ad</h2>
        <input className={FIELD} placeholder="Title" value={adTitle} onChange={(e) => setAdTitle(e.target.value)} />
        <ImageUploadField label="ad image" value={adImage} onChange={setAdImage} />
        <select className={FIELD} value={adCtaType}
          onChange={(e) => setAdCtaType(e.target.value === "internal" ? "internal" : "external")}>
          <option value="external">External URL</option>
          <option value="internal">Internal page (e.g. /premium)</option>
        </select>
        <input className={FIELD} placeholder="CTA destination (URL or /path)" value={adCtaUrl} onChange={(e) => setAdCtaUrl(e.target.value)} />
        <div className="flex gap-3 text-sm text-ink">
          {["home", "chat", "profile"].map((p) => (
            <label key={p} className="flex items-center gap-1">
              <input type="checkbox" checked={placements.includes(p)} onChange={() => togglePlacement(p)} />
              {p}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void post("/api/admin/ads", {
              title: adTitle,
              image_url: adImage ?? "",
              cta_type: adCtaType,
              cta_url: adCtaUrl,
              placements,
            })
          }
          className="rounded-lg bg-pink-500 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Post Ad
        </button>
      </section>
    </div>
  );
}