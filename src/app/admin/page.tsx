"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getToken } from "@/lib/supabase/client";

const FIELD = "p-2 rounded-lg bg-field border border-line text-ink text-sm w-full";

export default function AdminPage() {
  const [state, setState] = useState<"checking" | "admin" | "denied">("checking");
  const [busy, setBusy] = useState(false);

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState("");
  const [productCta, setProductCta] = useState("");

  const [adTitle, setAdTitle] = useState("");
  const [adImage, setAdImage] = useState("");
  const [adCtaUrl, setAdCtaUrl] = useState("");
  const [adCtaType, setAdCtaType] = useState<"internal" | "external">("external");
  const [placements, setPlacements] = useState<string[]>(["home"]);

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/admin/check", {
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      });
      const data = (await res.json()) as { isAdmin?: boolean };
      setState(data.isAdmin ? "admin" : "denied");
    }
    check();
  }, []);

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
    setPlacements((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  if (state === "checking") {
    return <div className="flex min-h-screen items-center justify-center bg-app text-ink"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (state === "denied") {
    return <div className="flex min-h-screen items-center justify-center bg-app p-6 text-center text-muted">You do not have admin access.</div>;
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4 pb-24">
      <h1 className="text-xl font-bold text-ink">Admin Console 🛠️</h1>

      <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
        <h2 className="font-semibold text-ink">New Product</h2>
        <input className={FIELD} placeholder="Name" value={productName} onChange={(e) => setProductName(e.target.value)} />
        <input className={FIELD} placeholder="Price (e.g. 1500)" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} />
        <input className={FIELD} placeholder="Image URL" value={productImage} onChange={(e) => setProductImage(e.target.value)} />
        <input className={FIELD} placeholder="Checkout URL (optional)" value={productCta} onChange={(e) => setProductCta(e.target.value)} />
        <button
          type="button"
          disabled={busy}
          onClick={() => post("/api/admin/products", {
            name: productName,
            price: Number(productPrice),
            image_url: productImage,
            cta_url: productCta || null,
          })}
          className="rounded-lg bg-pink-500 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Post Product
        </button>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
        <h2 className="font-semibold text-ink">New Ad</h2>
        <input className={FIELD} placeholder="Title" value={adTitle} onChange={(e) => setAdTitle(e.target.value)} />
        <input className={FIELD} placeholder="Image URL" value={adImage} onChange={(e) => setAdImage(e.target.value)} />
        <select className={FIELD} value={adCtaType} onChange={(e) => setAdCtaType(e.target.value === "internal" ? "internal" : "external")}>
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
          onClick={() => post("/api/admin/ads", {
            title: adTitle,
            image_url: adImage,
            cta_type: adCtaType,
            cta_url: adCtaUrl,
            placements,
          })}
          className="rounded-lg bg-pink-500 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Post Ad
        </button>
      </section>
    </main>
  );
}