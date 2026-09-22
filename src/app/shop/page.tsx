"use client";
import { useEffect, useState } from "react";
import { Link, ShoppingBag } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { getTelegramWebApp } from "@/lib/telegram/sdk";
import { CURRENCY_SYMBOLS } from "@/lib/utils/constants";
import type { Product } from "@/types";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await getSupabase()
        .from("products").select("*")
        .order("created_at", { ascending: false });
      setProducts((data ?? []) as Product[]);
      setLoading(false);
    }
    load();
  }, []);

  function buy(product: Product) {
    if (!product.cta_url) return;
    const tg = getTelegramWebApp();
    if (tg) tg.openLink(product.cta_url);
    else window.open(product.cta_url, "_blank", "noopener");
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
            <Link key={p.id} href={`/shop/${p.id}`} className="overflow-hidden rounded-xl border border-line bg-surface">
            <div key={p.id} className="overflow-hidden rounded-xl border border-line bg-surface">
              <img src={p.image_url} alt={p.name} className="h-32 w-full object-cover" />
              <div className="flex flex-col gap-1 p-3">
                <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                <p className="text-sm font-bold text-pink-500">
                  {CURRENCY_SYMBOLS[p.currency] ?? p.currency}{p.price}
                </p>
                <button
                  type="button"
                  disabled={!p.cta_url || p.status !== "active"}
                  onClick={() => buy(p)}
                  className="mt-1 rounded-lg bg-pink-500 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  {p.cta_label}
                </button>
              </div>
            </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}