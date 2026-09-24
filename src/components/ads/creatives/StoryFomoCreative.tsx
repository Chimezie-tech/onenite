"use client";
import { useSearchParams } from "next/navigation";
import CreativeShell from "@/components/ads/CreativeShell";

const GRADS = [
  "from-rose-400 to-pink-600",
  "from-sky-400 to-indigo-600",
  "from-amber-300 to-orange-500",
  "from-emerald-300 to-teal-600",
  "from-fuchsia-400 to-purple-600",
  "from-red-400 to-rose-600",
];

export default function StoryFomoCreative() {
  const params = useSearchParams();
  const city = params.get("city") ?? "your city";
  const count = params.get("count") ?? "3";

  return (
    <CreativeShell width={1080} height={1920} filename={`onenite-story-fomo-${city.replace(/\s+/g, "-")}`}>
      <div className="flex h-full w-full flex-col items-center bg-neutral-950 px-[72px] text-white">
        <div className="h-[250px]" />

        <div className="relative grid grid-cols-3 gap-6">
          {GRADS.map((g, i) => (
            <div key={i} className={`h-[220px] w-[220px] rounded-[32px] bg-gradient-to-br ${g} opacity-80 blur-[10px]`} />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/70 px-8 py-4 text-[40px] font-bold backdrop-blur">
              🔒 {count} new likes
            </span>
          </div>
        </div>

        <h1 className="mt-16 text-center text-[92px] font-black leading-[1.08]">
          <span className="text-pink-500">{count} people</span> in {city} liked you this week.
        </h1>
        <p className="mt-8 text-center text-[42px] text-neutral-300">
          They&apos;re waiting right now. See exactly who — free.
        </p>

        <div className="mt-auto w-full pb-[140px]">
          <div className="flex items-center justify-center rounded-full bg-pink-500 py-6 text-[40px] font-bold shadow-xl shadow-pink-500/30">
            Tap to reveal who ❤
          </div>
          <p className="mt-5 text-center text-[30px] text-neutral-500">
            Inside Telegram · @OneNite_bot · 18+
          </p>
        </div>
      </div>
    </CreativeShell>
  );
}