"use client";
import { useSearchParams } from "next/navigation";
import CreativeShell from "@/components/ads/CreativeShell";

export default function FeedFrictionlessCreative() {
  const params = useSearchParams();
  const city = params.get("city") ?? "your city";

  return (
    <CreativeShell width={1080} height={1080} filename={`onenite-feed-frictionless-${city.replace(/\s+/g, "-")}`}>
      <div className="flex h-full w-full bg-gradient-to-br from-white via-pink-50 to-pink-100">
        <div className="flex flex-1 flex-col justify-center px-[80px]">
          <span className="w-fit rounded-full bg-pink-500/10 px-5 py-2 text-[28px] font-bold uppercase tracking-widest text-pink-600">
            Telegram Mini App
          </span>
          <h1 className="mt-8 text-[88px] font-black leading-[1.05] tracking-tight text-neutral-900">
            The dating app <span className="text-pink-500">inside</span> Telegram.
          </h1>
          <ul className="mt-10 flex flex-col gap-5 text-[36px] font-semibold text-neutral-700">
            <li>✅ No download, no signup forms</li>
            <li>🛡️ AI-verified real profiles</li>
            <li>💬 Match & chat instantly</li>
          </ul>
          <div className="mt-12 w-fit rounded-full bg-[#229ED9] px-10 py-5 text-[36px] font-bold text-white shadow-lg">
            ✈ Try it free — @OneNite_bot
          </div>
        </div>

        <div className="flex w-[460px] items-center justify-center pr-[80px]">
          <div className="h-[860px] w-[420px] rounded-[56px] border-[14px] border-neutral-900 bg-neutral-900 shadow-2xl">
            <div className="flex h-full w-full flex-col overflow-hidden rounded-[42px] bg-neutral-950">
              <div className="flex items-center justify-between bg-neutral-900 px-6 py-4">
                <p className="text-[28px] font-bold text-white">OneNite</p>
                <span className="text-[24px]">💎</span>
              </div>
              <div className="relative mx-4 mt-4 flex-1 rounded-[28px] bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-600">
                <div className="absolute inset-x-0 bottom-0 rounded-b-[28px] bg-black/45 p-4">
                  <p className="text-[30px] font-bold text-white">Zainab, 23</p>
                  <p className="text-[24px] text-white/80">📍 {city} · 3 km</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 py-5">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-[28px] text-white">✕</span>
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-[30px] text-white">❤</span>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-[28px] text-white">⭐</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CreativeShell>
  );
}