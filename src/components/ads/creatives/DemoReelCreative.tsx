"use client";
import { useEffect, useState } from "react";

type Step =
  | "deck1" | "swipe1" | "deck2" | "swipe2" | "match"
  | "t1" | "m1" | "t2" | "m2" | "t3" | "m3" | "t4" | "m4" | "t5" | "m5"
  | "end";

const SEQUENCE: Array<{ step: Step; ms: number }> = [
  { step: "deck1", ms: 1200 },
  { step: "swipe1", ms: 900 },
  { step: "deck2", ms: 800 },
  { step: "swipe2", ms: 900 },
  { step: "match", ms: 2600 },
  { step: "t1", ms: 700 },
  { step: "m1", ms: 1000 },
  { step: "t2", ms: 600 },
  { step: "m2", ms: 1000 },
  { step: "t3", ms: 700 },
  { step: "m3", ms: 1000 },
  { step: "t4", ms: 600 },
  { step: "m4", ms: 1000 },
  { step: "t5", ms: 700 },
  { step: "m5", ms: 1200 },
  { step: "end", ms: 2800 },
];

const MESSAGES: Array<{ me: boolean; text: string }> = [
  { me: false, text: "Heyy! You also like Afrobeats? 🎵" },
  { me: true, text: "Asake everything 😄 Burna never skips" },
  { me: false, text: "Hahaha correct!! Concert this weekend?" },
  { me: true, text: "Say less — Saturday?" },
  { me: false, text: "It's a date ❤️" },
];

const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  left: (i * 41) % 100,
  delay: (i % 8) * 0.25,
  color: ["#ec4899", "#f59e0b", "#22d3ee", "#a3e635", "#f472b6"][i % 5],
}));

const CARDS = [
  { name: "Amara, 24", img: "/ads/beach-1.jpg", tags: ["Afrobeats", "Foodie"] },
  { name: "Zainab, 23", img: "/ads/beach-2.jpg", tags: ["Movies", "Travel"] },
];

export default function DemoReelCreative() {
  const [idx, setIdx] = useState(0);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const timer = setTimeout(() => setIdx((i) => (i + 1) % SEQUENCE.length), SEQUENCE[idx].ms);
    return () => clearTimeout(timer);
  }, [idx]);

  useEffect(() => {
    function fit() {
      const s = Math.min((window.innerWidth - 24) / 1080, (window.innerHeight - 150) / 1920, 1);
      setScale(Math.max(0.1, s));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const step = SEQUENCE[idx].step;
  const scene: "deck" | "match" | "chat" | "end" =
    step === "match" ? "match"
    : step === "end" ? "end"
    : step.startsWith("t") || step.startsWith("m") ? "chat"
    : "deck";

  const deckCard = step === "deck1" || step === "swipe1" ? 0 : 1;
  const flying = step === "swipe1" || step === "swipe2";
  const visibleMsgs =
    scene === "chat"
      ? MESSAGES.slice(0, Math.max(1, Math.ceil((idx - 5) / 2)))
      : [];
  const typingOwner: "her" | "me" | null =
    scene === "chat" && step.startsWith("t")
      ? (MESSAGES[Math.ceil((idx - 5) / 2) - 1]?.me ? "me" : "her")
      : null;

  return (
    <div className="flex min-h-screen flex-col items-center gap-3 bg-neutral-900 p-3">
      <style>{`
        .dr-fly { transform: translateX(150%) rotate(16deg) !important; opacity: 0 !important;
                  transition: transform .8s ease-in, opacity .8s ease-in; }
        .dr-pop { animation: dr-pop .35s ease-out both; }
        @keyframes dr-pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .dr-dot { animation: dr-bounce 1s infinite; }
        .dr-dot:nth-child(2) { animation-delay: .15s; }
        .dr-dot:nth-child(3) { animation-delay: .3s; }
        @keyframes dr-bounce { 0%,60%,100% { transform: translateY(0); opacity:.5; } 30% { transform: translateY(-8px); opacity:1; } }
        .dr-confetti { position: absolute; top: -40px; width: 14px; height: 22px; border-radius: 4px;
                       animation: dr-fall 2.4s linear infinite; }
        @keyframes dr-fall { from { transform: translateY(0) rotate(0deg); } to { transform: translateY(2100px) rotate(720deg); opacity: .3; } }
      `}</style>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-300">
        <span className="rounded-lg bg-pink-500 px-3 py-1.5 font-bold text-white">🎬 17s demo reel — loops automatically</span>
        <span>Record it: phone screen-recorder (full-screen) or OBS at 1080×1920 → trim → upload to Meta Reels</span>
      </div>

      <div style={{ width: 1080 * scale, height: 1920 * scale }} className="overflow-hidden rounded-2xl shadow-2xl">
        <div style={{ width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: "top left" }} className="relative bg-neutral-950">

          {/* ============ DECK SCENE (real photos) ============ */}
          {scene === "deck" && (
            <div className="flex h-full flex-col bg-neutral-950 px-10 pt-24">
              <div className="flex items-center justify-between px-2">
                <p className="text-5xl font-black text-white">OneNite <span className="text-pink-500">❤</span></p>
                <span className="text-4xl">💎</span>
              </div>
              <div className="relative mt-10 flex-1">
                <div className="absolute inset-x-8 top-6 bottom-0 rounded-[48px] bg-neutral-800" />
                <div className={`absolute inset-x-8 top-0 bottom-0 overflow-hidden rounded-[48px] bg-neutral-800 shadow-2xl ${flying ? "dr-fly" : ""}`}>
                  <img
                    src={CARDS[deckCard].img}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div
                    className="absolute left-8 top-8 rounded-2xl border-4 border-pink-400 px-6 py-2 text-5xl font-black tracking-widest text-pink-400 transition-opacity duration-300"
                    style={{ transform: "rotate(-18deg)", opacity: flying ? 1 : 0 }}
                  >
                    LIKE
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-10 pt-24">
                    <p className="text-6xl font-bold text-white drop-shadow">{CARDS[deckCard].name}</p>
                    <p className="mt-2 text-4xl text-white/85 drop-shadow">📍 Lagos · 3 km away</p>
                    <div className="mt-4 flex gap-3">
                      {CARDS[deckCard].tags.map((t) => (
                        <span key={t} className="rounded-full bg-white/25 px-5 py-2 text-3xl text-white backdrop-blur">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-10 py-14">
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-800 text-5xl text-red-400">✕</span>
                <span className="flex h-28 w-28 items-center justify-center rounded-full bg-pink-500 text-6xl shadow-lg shadow-pink-500/40">❤</span>
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-800 text-5xl text-amber-300">⭐</span>
              </div>
            </div>
          )}

          {/* ============ MATCH SCENE (photo avatars) ============ */}
          {scene === "match" && (
            <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-pink-600 via-fuchsia-600 to-purple-700">
              {CONFETTI.map((c, i) => (
                <span key={i} className="dr-confetti" style={{ left: `${c.left}%`, backgroundColor: c.color, animationDelay: `${c.delay}s` }} />
              ))}
              <div className="dr-pop flex flex-col items-center">
                <div className="flex -space-x-10">
                  <div className="h-56 w-56 overflow-hidden rounded-full border-8 border-white shadow-xl">
                    <img src="/ads/beach-1.jpg" alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex h-56 w-56 items-center justify-center rounded-full border-8 border-white bg-gradient-to-br from-sky-400 to-indigo-600 shadow-xl">
                    <span className="text-5xl font-black text-white">YOU</span>
                  </div>
                </div>
                <h1 className="mt-14 text-[110px] font-black text-white drop-shadow-lg">It&apos;s a Match! 🎉</h1>
                <p className="mt-4 text-4xl text-white/90">You and Amara liked each other</p>
                <div className="mt-12 rounded-full bg-white px-12 py-5 text-4xl font-bold text-pink-600 shadow-xl">Say hello 👋</div>
              </div>
            </div>
          )}

          {/* ============ CHAT SCENE (photo avatar in header) ============ */}
          {scene === "chat" && (
            <div className="flex h-full flex-col bg-neutral-950">
              <div className="flex items-center gap-4 border-b border-neutral-800 px-8 pb-6 pt-24">
                <div className="h-16 w-16 overflow-hidden rounded-full">
                  <img src="/ads/beach-1.jpg" alt="" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-4xl font-bold text-white">Amara</p>
                  <p className="text-3xl text-emerald-400">● online</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-end gap-5 overflow-hidden px-8 pb-8">
                {visibleMsgs.map((m, i) => (
                  <div key={i} className={`dr-pop max-w-[75%] rounded-3xl px-7 py-5 text-4xl ${m.me ? "self-end bg-pink-500 text-white" : "self-start bg-neutral-800 text-white"}`}>
                    {m.text}
                  </div>
                ))}
                {typingOwner && (
                  <div className={`flex gap-2 rounded-3xl px-7 py-6 ${typingOwner === "me" ? "self-end bg-pink-500" : "self-start bg-neutral-800"}`}>
                    <span className="dr-dot h-4 w-4 rounded-full bg-white/80" />
                    <span className="dr-dot h-4 w-4 rounded-full bg-white/80" />
                    <span className="dr-dot h-4 w-4 rounded-full bg-white/80" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 border-t border-neutral-800 px-8 py-6">
                <div className="flex-1 rounded-full bg-neutral-800 px-8 py-4 text-3xl text-neutral-500">Message…</div>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-3xl">➤</span>
              </div>
            </div>
          )}

          {/* ============ END CARD ============ */}
          {scene === "end" && (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-neutral-950 via-[#3b0f2a] to-pink-600 px-16 text-center">
              <div className="dr-pop flex h-40 w-40 items-center justify-center rounded-[40px] bg-pink-500 shadow-2xl shadow-pink-500/40">
                <span className="text-7xl">❤</span>
              </div>
              <h1 className="mt-12 text-[96px] font-black leading-tight text-white">Your turn.</h1>
              <p className="mt-4 text-4xl text-white/85">Real people. Your city. Tonight.</p>
              <div className="mt-14 flex w-full items-center justify-center rounded-full bg-[#229ED9] py-6 text-4xl font-bold text-white shadow-xl">
                ✈ Open in Telegram — @OneNite_bot
              </div>
              <p className="mt-6 text-3xl text-white/60">Free to start · AI-verified · 18+</p>
            </div>
          )}

        </div>
      </div>

      <p className="max-w-md text-center text-xs text-neutral-400">
        Preview scaled to {Math.round(scale * 100)}%. The reel area is exactly 1080×1920 (9:16). Record one full loop (~17s), then trim the first/last second.
      </p>
    </div>
  );
}