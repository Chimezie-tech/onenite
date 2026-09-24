import Link from "next/link";

const COPY = [
  {
    angle: "Angle 1 — Local Discovery (Stories/Reels)",
    creative: "/ads/story-local?city=Lagos",
    primary:
      "Meet real, verified locals in your city tonight. No endless swiping, no bots. Just real connections right in your neighborhood. Tap below to open directly in Telegram! 👇",
    headline: "Tired of dating apps full of people 500 miles away? 📍",
    cta: "Learn More",
  },
  {
    angle: "Angle 2 — Frictionless (Feed)",
    creative: "/ads/feed-frictionless?city=Lagos",
    primary:
      "Stop downloading 500MB dating apps that drain your battery. OneNite is a Mini App inside Telegram. AI-verified profiles, instant messaging, and zero downloads. Try it free today!",
    headline: "The dating app that lives inside Telegram. 🤯",
    cta: "Open App / Learn More",
  },
  {
    angle: "Angle 3 — FOMO (Retargeting)",
    creative: "/ads/story-fomo?city=Lagos&count=3",
    primary:
      "Don't leave them hanging. See exactly who wants to meet you on OneNite. 100% verified locals. Tap to unlock your matches!",
    headline: "Someone in your city just liked your profile... 👀",
    cta: "Sign Up",
  },
];

export default function AdsHubPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-neutral-950 p-6 text-neutral-100">
      <div>
        <h1 className="text-2xl font-black">🎨 OneNite Ad Creative Studio</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Open a creative, tweak <code className="text-pink-400">?city=</code> / <code className="text-pink-400">?count=</code>, download the PNG, upload to Meta Ads Manager with the copy below.
        </p>
      </div>

      {COPY.map((c) => (
        <section key={c.angle} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-pink-400">{c.angle}</h2>
            <Link href={c.creative} className="shrink-0 rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-bold text-white">
              Open editor →
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Primary text</p>
              <p className="mt-1 select-all rounded-lg bg-neutral-800 p-3 text-neutral-200">{c.primary}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Headline</p>
              <p className="mt-1 select-all rounded-lg bg-neutral-800 p-3 text-neutral-200">{c.headline}</p>
            </div>
            <p className="text-xs text-neutral-500">CTA button in Ads Manager: <span className="font-bold text-neutral-300">{c.cta}</span> · Destination URL: <span className="select-all text-neutral-300">https://onenite.vercel.app/landing</span></p>
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-sm text-neutral-300">
        <h2 className="font-bold text-neutral-100">📋 Campaign settings recap</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Objective: <b>Traffic</b> → destination <code>onenite.vercel.app/landing</code></li>
          <li>Placements: IG Reels + Stories + FB Reels (vertical creatives), FB Feed (square)</li>
          <li>Targeting: ONE city pin, age 18–34, broad interests</li>
          <li>Budget: $10–20/day per angle; kill losers after 3 days, scale winners</li>
          <li>Compliance: no sexual imagery, 18+ only, no body-part zooms</li>
        </ul>
        <p className="mt-3 text-xs text-neutral-500">
          🎬 Video version: screen-record 15s of real swiping on your phone → CapCut → overlay the headline text above → export 9:16.
        </p>
      </section>
    </main>
  );
}