"use client";
import { useSearchParams } from "next/navigation";
import CreativeShell from "@/components/ads/CreativeShell";

export default function StoryLocalCreative() {
  const params = useSearchParams();
  const city = params.get("city") ?? "your city";

  return (
    <CreativeShell width={1080} height={1920} filename={`onenite-story-local-${city.replace(/\s+/g, "-")}`}>
      <div className="flex h-full w-full flex-col bg-gradient-to-b from-[#160a12] via-[#4c1d95] to-[#ec4899] px-[72px] text-white">
        <div className="h-[250px]" />
        <span className="w-fit rounded-full bg-white/15 px-6 py-3 text-[36px] font-semibold backdrop-blur">
          📍 {city} · tonight
        </span>
        <h1 className="mt-10 text-[96px] font-black leading-[1.05] tracking-tight">
          Tired of matches <span className="text-[#f9a8d4]">500 miles</span> away?
        </h1>
        <p className="mt-8 text-[44px] font-medium text-pink-100/90">
          OneNite shows only AI-verified people in {city} — ready to meet tonight.
        </p>

        <div className="relative mt-16 h-[560px]">
          <div className="absolute left-1/2 top-6 h-[520px] w-[380px] -translate-x-[62%] -rotate-6 rounded-[36px] bg-gradient-to-br from-amber-400 to-rose-500 opacity-70" />
          <div className="absolute left-1/2 top-3 h-[520px] w-[380px] -translate-x-[38%] rotate-6 rounded-[36px] bg-gradient-to-br from-sky-400 to-indigo-500 opacity-80" />
          <div className="absolute left-1/2 top-0 h-[540px] w-[400px] -translate-x-1/2 rounded-[36px] bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 shadow-2xl">
            <div className="absolute inset-x-0 bottom-0 rounded-b-[36px] bg-black/45 p-6">
              <p className="text-[40px] font-bold">Amara, 24</p>
              <p className="text-[30px] text-white/80">2 km away · {city}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pb-[140px]">
          <div className="flex items-center justify-center gap-4 rounded-full bg-[#229ED9] py-6 text-[40px] font-bold shadow-xl">
            ✈ Open in Telegram — @OneNite_bot
          </div>
          <p className="mt-5 text-center text-[30px] text-white/70">
            No App Store download · Free to start · 18+
          </p>
        </div>
      </div>
    </CreativeShell>
  );
}