"use client";
import Link from "next/link";
import { Heart, Lock } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";

export default function LikesPage() {
  const { likesReceived } = useBadges();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 pb-24 text-center">
      <div className="relative">
        <Heart className="h-12 w-12 text-pink-500" />
        {likesReceived > 0 && (
          <span className="absolute -right-3 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-pink-500 px-1.5 text-xs font-bold text-white">
            {likesReceived > 9 ? "9+" : likesReceived}
          </span>
        )}
      </div>

      <p className="text-lg font-bold text-ink">
        {likesReceived > 0
          ? `${likesReceived} ${likesReceived === 1 ? "person likes" : "people like"} you 💗`
          : "No likes yet"}
      </p>
      <p className="text-sm text-muted">
        {likesReceived > 0
          ? "Go Premium to see exactly who they are and match instantly."
          : "Keep swiping — likes appear here the moment someone likes you."}
      </p>

      {likesReceived > 0 && (
        <div className="w-full rounded-xl border border-line bg-surface p-4">
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative h-24 overflow-hidden rounded-lg bg-field">
                <div className="absolute inset-0 bg-pink-500/20 backdrop-blur-xl" />
                <Lock className="absolute inset-0 m-auto h-4 w-4 text-white/70" />
              </div>
            ))}
          </div>
          <Link
            href="/premium"
            className="block rounded-xl bg-pink-500 py-2.5 text-sm font-bold text-white"
          >
            Unlock who likes you 💎
          </Link>
        </div>
      )}
    </main>
  );
}