"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { openAdCta, trackAd } from "@/lib/ads";
import type { Ad, AdPlacement } from "@/types";

export default function AdBanner({ placement }: { placement: AdPlacement }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await getSupabase().from("ads").select("*").order("sort_order").limit(50);
      const found = ((data ?? []) as Ad[]).find((a) => a.placements.includes(placement)) ?? null;
      setAd(found);
      if (found) trackAd(found.id, "impression");
    }
    load();
  }, [placement]);

  if (!ad) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2">
      <img src={ad.image_url} alt={ad.title} className="h-12 w-12 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-ink">{ad.title}</p>
        <p className="truncate text-[11px] text-muted">{ad.subtitle}</p>
      </div>
      <button
        type="button"
        onClick={() => { trackAd(ad.id, "click"); openAdCta(ad, router); }}
        className="shrink-0 rounded-lg bg-pink-500 px-2.5 py-1.5 text-[11px] font-bold text-white"
      >
        {ad.cta_label}
      </button>
    </div>
  );
}