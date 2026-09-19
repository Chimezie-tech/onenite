"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { AD_ROTATION_MS } from "@/lib/utils/constants";
import { openAdCta, trackAd } from "@/lib/ads";
import type { Ad } from "@/types";

export default function AdCarousel() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [index, setIndex] = useState(0);
  const seen = useRef<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await getSupabase()
        .from("ads").select("*")
        .order("sort_order", { ascending: true });
      setAds(((data ?? []) as Ad[]).filter((a) => a.placements.includes("home")));
    }
    load();
  }, []);

  // Continuous rotation
  useEffect(() => {
    if (ads.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % ads.length), AD_ROTATION_MS);
    return () => clearInterval(timer);
  }, [ads.length]);

  // One impression per ad per session
  useEffect(() => {
    const ad = ads[index];
    if (ad && !seen.current.has(ad.id)) {
      seen.current.add(ad.id);
      trackAd(ad.id, "impression");
    }
  }, [index, ads]);

  if (ads.length === 0) return null;
  const ad = ads[index];

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
      <img src={ad.image_url} alt={ad.title} className="h-40 w-full object-cover" />
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{ad.title}</p>
          <p className="truncate text-xs text-muted">{ad.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => { trackAd(ad.id, "click"); openAdCta(ad, router); }}
          className="shrink-0 rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-bold text-white"
        >
          {ad.cta_label}
        </button>
      </div>
      {ads.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
          {ads.map((a, i) => (
            <button
              key={a.id} type="button" aria-label={`Show ad ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-pink-500" : "w-1.5 bg-muted"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}