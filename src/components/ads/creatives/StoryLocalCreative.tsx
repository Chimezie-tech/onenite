"use client";
import { useSearchParams } from "next/navigation";
import CreativeShell from "@/components/ads/CreativeShell";

export default function StoryLocalCreative() {
  const params = useSearchParams();
  const city = params.get("city") ?? "your city";

  return (
    <CreativeShell width={1080} height={1920} filename={`onenite-story-local-${city.replace(/\s+/g, "-")}`}>
      <div className="relative flex h-full w-full flex-col overflow-hidden text-white">
        <img src="/ads/beach-1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Readability scrim + keeps Story safe-zones clear */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/45" />

        <div className="relative flex h-full flex-col px-[72px]">
          <div className="h-[250px]" />
          <span className="w-fit rounded-full bg-white/20 px-6 py-3 text-[36px] font-semibold backdrop-blur">
            📍 {city} · tonight
          </span>
          <h1 className="mt-10 text-[96px] font-black leading-[1.05] tracking-tight drop-shadow-lg">
            Tired of matches <span className="text-[#f9a8d4]">500 miles</span> away?
          </h1>
          <p className="mt-8 max-w-[820px] text-[44px] font-medium text-white/90 drop-shadow">
            OneNite shows only AI-verified people in {city} — ready to meet tonight.
          </p>

          <div className="mt-auto pb-[140px]">
            <div className="flex items-center justify-center gap-4 rounded-full bg-[#229ED9] py-6 text-[40px] font-bold shadow-xl">
              ✈ Open in Telegram — @OneNite_bot
            </div>
            <p className="mt-5 text-center text-[30px] text-white/75">
              No App Store download · Free to start · 18+
            </p>
          </div>
        </div>
      </div>
    </CreativeShell>
  );
}