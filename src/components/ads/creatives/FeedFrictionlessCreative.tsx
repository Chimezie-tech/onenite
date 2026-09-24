"use client";
import { useSearchParams } from "next/navigation";
import CreativeShell from "@/components/ads/CreativeShell";

export default function FeedFrictionlessCreative() {
  const params = useSearchParams();
  const city = params.get("city") ?? "your city";

  return (
    <CreativeShell width={1080} height={1080} filename={`onenite-feed-frictionless-${city.replace(/\s+/g, "-")}`}>
      <div className="relative flex h-full w-full overflow-hidden">
        <img src="/ads/beach-2.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Left-to-right scrim so copy stays readable over the photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />

        <div className="relative flex flex-1 flex-col justify-center px-[80px]">
          <span className="w-fit rounded-full bg-pink-500/90 px-5 py-2 text-[28px] font-bold uppercase tracking-widest text-white">
            Telegram Mini App
          </span>
          <h1 className="mt-8 text-[88px] font-black leading-[1.05] tracking-tight text-white drop-shadow-lg">
            The dating app <span className="text-pink-400">inside</span> Telegram.
          </h1>
          <ul className="mt-10 flex flex-col gap-5 text-[36px] font-semibold text-white/90">
            <li>✅ No download, no signup forms</li>
            <li>🛡️ AI-verified real profiles</li>
            <li>💬 Match & chat instantly — in {city}</li>
          </ul>
          <div className="mt-12 w-fit rounded-full bg-[#229ED9] px-10 py-5 text-[36px] font-bold text-white shadow-lg">
            ✈ Try it free — @OneNite_bot
          </div>
        </div>
      </div>
    </CreativeShell>
  );
}