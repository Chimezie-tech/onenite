import Link from "next/link";
import { Heart, MapPin, ShieldCheck, Sparkles, Zap } from "lucide-react";

export const metadata = {
  title: "OneNite | Meet Locals Instantly",
  description: "The fastest way to meet verified people in your city. No downloads required.",
};

export default function LandingPage() {
  // The deep link that opens Telegram and tags the user as coming from Meta
  const telegramLink = "https://t.me/OneNite_bot/app?startapp=meta";

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-12">
      {/* Hero Section */}
      <div className="mx-auto flex max-w-md flex-col items-center px-6 pt-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-500 shadow-lg shadow-pink-500/30">
          <Heart className="h-10 w-10 text-white" fill="white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">
          Meet Locals <br /> <span className="text-pink-500">Instantly.</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Stop swiping on bots. OneNite connects you with real, AI-verified people in your city right now.
        </p>
        
        {/* Primary CTA */}
        <a
          href={telegramLink}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0088cc] py-5 text-xl font-bold text-white shadow-xl shadow-blue-500/20 transition-transform hover:scale-[1.02] active:scale-95"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.06-.2-.06-.06-.16-.04-.23-.02-.1.02-1.69 1.07-4.76 3.15-.45.31-.86.46-1.23.45-.41-.01-1.18-.23-1.76-.41-.71-.23-1.28-.35-1.23-.74.03-.2.31-.41.85-.62 3.33-1.45 5.55-2.41 6.66-2.87 3.17-1.33 3.83-1.56 4.26-1.56.1 0 .31.02.44.13.11.09.14.21.16.31.01.07.01.19 0 .31z"/>
          </svg>
          Open in Telegram
        </a>
        <p className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          <Zap className="h-3 w-3" /> No App Store download required
        </p>
      </div>

      {/* Social Proof / Features */}
      <div className="mx-auto mt-12 max-w-md space-y-4 px-6">
        <FeatureCard 
          icon={<ShieldCheck className="h-6 w-6 text-emerald-500" />}
          title="100% Verified Profiles"
          desc="Our AI moderation ensures you're talking to real people, not bots or scammers."
        />
        <FeatureCard 
          icon={<MapPin className="h-6 w-6 text-pink-500" />}
          title="Hyper-Local Matching"
          desc="Only see people who are actually in your city and ready to meet up."
        />
        <FeatureCard 
          icon={<Sparkles className="h-6 w-6 text-amber-500" />}
          title="Skip the Line"
          desc="See exactly who already liked you and match instantly."
        />
      </div>

      {/* Sticky Bottom CTA for scrollers */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/90 p-4 backdrop-blur-md">
        <a
          href={telegramLink}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 py-4 text-lg font-bold text-white shadow-lg"
        >
          Start Swiping Now ❤️
        </a>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="rounded-xl bg-gray-50 p-2">{icon}</div>
      <div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}