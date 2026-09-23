"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Store, Truck } from "lucide-react";
import BackHeader from "@/components/layout/BackHeader";
import { getSupabase, getToken } from "@/lib/supabase/client";
import { CURRENCY_SYMBOLS } from "@/lib/utils/constants";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await getSupabase()
        .from("products").select("*").eq("id", params.productId).maybeSingle();
      if (active) setProduct((data as Product) ?? null);
    })();
    return () => {
      active = false;
    };
  }, [params.productId]);

  async function sendEnquiry() {
    const res = await fetch("/api/shop/enquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken() ?? ""}`,
      },
      body: JSON.stringify({ productId: params.productId, message }),
    });
    if (res.ok) {
      setSent(true);
      setMessage("");
    }
  }

  if (!product) return <p className="p-6 text-sm text-muted">Loading…</p>;

  const images = (product.images?.length ? product.images : [product.image_url]).filter(Boolean);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-3 p-4 pb-24">
      <BackHeader title={product.name} />

      {images.length > 0 ? (
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-2xl">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${product.name} ${i + 1}`}
              className="h-64 w-full shrink-0 snap-center rounded-2xl object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-line bg-surface text-xs text-muted">
          No images yet
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xl font-bold text-pink-500">
          {CURRENCY_SYMBOLS[product.currency] ?? ""}
          {Number(product.price).toLocaleString()}
        </p>
        {product.shipping_available ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-500">
            <Truck className="h-3 w-3" /> Shipping available
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-500">
            <Store className="h-3 w-3" /> Pickup only
          </span>
        )}
      </div>

      {product.location && (
        <p className="flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3" /> {product.location}
        </p>
      )}

      {product.colors?.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Colors</p>
          <div className="flex gap-2">
            {product.colors.map((c) => (
              <span
                key={c}
                title={c}
                className="h-6 w-6 rounded-full border border-line"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {product.description && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Description</p>
          <p className={`mt-1 whitespace-pre-wrap text-sm text-ink ${expanded ? "" : "line-clamp-3"}`}>
            {product.description}
          </p>
          {product.description.length > 120 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs font-semibold text-pink-500"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setEnquiryOpen(true)}
        className="rounded-xl bg-pink-500 py-3 text-sm font-bold text-white"
      >
        Enquire about this product 💬
      </button>

      {enquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-4">
            <p className="font-bold text-ink">Enquire: {product.name}</p>
            {sent ? (
              <p className="mt-3 text-sm text-muted">
                Sent! The seller team will reply in your Telegram chat shortly. ✅
              </p>
            ) : (
              <textarea
                className="mt-3 h-24 w-full rounded-lg border border-line bg-field p-2 text-sm text-ink"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about size, availability, delivery…"
              />
            )}
            <div className="mt-3 flex gap-2">
              {!sent && (
                <button
                  type="button"
                  disabled={!message.trim()}
                  onClick={() => void sendEnquiry()}
                  className="flex-1 rounded-lg bg-pink-500 py-2 text-xs font-bold text-white disabled:opacity-40"
                >
                  Send enquiry
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEnquiryOpen(false);
                  setSent(false);
                }}
                className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}