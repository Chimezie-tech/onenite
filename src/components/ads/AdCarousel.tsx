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
    <div>
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
      {ads.length > 1 && (
        <div className="mt-1 flex justify-center gap-1">
          {ads.map((a, i) => (
            <button key={a.id} type="button" aria-label={`Show ad ${i + 1}`} onClick={() => setIndex(i)}
              className={`h-1 rounded-full ${i === index ? "w-3 bg-pink-500" : "w-1 bg-muted"}`} />
          ))}
        </div>
      )}
    </div>
  );
}