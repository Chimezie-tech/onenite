"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Share2, ShoppingBag } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { getTelegramWebApp } from "@/lib/telegram/sdk";
import type { Product } from "@/types";

interface Category { id: string; name: string; }
interface Currency { code: string; symbol: string; }

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [views, setViews] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const [p, m, s] = await Promise.all([
        getSupabase().from("products").select("*").order("created_at", { ascending: false }),
        fetch("/api/admin/meta"),
        fetch("/api/shop/stats"),
      ]);
      if (!active) return;
      setProducts((p.data ?? []) as Product[]);
      if (m.ok) {
        const meta = (await m.json()) as { categories: Category[]; currencies: Currency[] };
        setCategories(meta.categories);
        setCurrencies(meta.currencies);
      }
      if (s.ok) {
        const stats = (await s.json()) as { views: Record<string, number> };
        setViews(stats.views);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  function symbol(code: string): string {
    return currencies.find((c) => c.code === String(code))?.symbol ?? "";
  }

  function share(e: React.MouseEvent, p: Product) {
    e.preventDefault();
    e.stopPropagation();
    const link = `https://t.me/OneNite_bot/app?startapp=p_${p.id}`;
    const text = encodeURIComponent(`Check out "${p.name}" on OneNite Shop! 🛍️`);
    const url = encodeURIComponent(link);
    const tg = getTelegramWebApp();
    if (tg) tg.openTelegramLink(`https://t.me/share/url?url=${url}&text=${text}`);
    else window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
    void fetch("/api/shop/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: p.id, event: "share" }),
    }).catch(() => undefined);
  }

  return (
    <main className="mx-auto max-w-md p-4 pb-24">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-ink">
        <ShoppingBag className="h-5 w-5 text-pink-500" /> OneNite Shop
      </h1>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : products.length === 0 ? (
        <p className="mt-10 text-center text-muted">No products yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/shop/${p.id}`}
              className="relative overflow-hidden rounded-xl border border-line bg-surface"
            >
              <img
                src={p.thumbnail_url ?? p.image_url}
                alt={p.name}
                className="h-32 w-full object-cover"
              />
              <button
                type="button"
                aria-label="Share product"
                onClick={(e) => share(e, p)}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white"
              >
                <Share2 className="h-3 w-3" />
              </button>
              <div className="flex flex-col gap-1 p-3">
                {p.category_id && (
                  <span className="w-fit rounded-full bg-pink-500/15 px-2 py-0.5 text-[10px] font-semibold text-pink-500">
                    {categories.find((c) => c.id === String(p.category_id))?.name ?? "Other"}
                  </span>
                )}
                <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-pink-500">
                    {symbol(p.currency)}{Number(p.price).toLocaleString()}
                  </p>
                  <span className="flex items-center gap-1 text-[10px] text-muted">
                    <Eye className="h-3 w-3" /> {views[p.id] ?? 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}