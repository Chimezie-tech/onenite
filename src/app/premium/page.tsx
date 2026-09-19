"use client";
import { Sparkles } from "lucide-react";
import { PLANS } from "@/lib/utils/constants";
import type { PlanId } from "@/types";

export default function PremiumPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-24">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
        <Sparkles className="h-5 w-5 text-pink-500" /> OneNite Premium
      </h1>
      <ul className="flex flex-col gap-2 text-sm text-ink">
        <li>• Unlimited likes every day</li>
        <li>• 5 super likes daily</li>
        <li>• See who already liked you</li>
        <li>• Profile boosts & advanced filters</li>
      </ul>
      {(Object.keys(PLANS) as PlanId[]).map((id) => (
        <div
          key={id}
          className="flex items-center justify-between rounded-xl border border-line bg-surface p-4"
        >
          <span className="font-semibold capitalize text-ink">{id}</span>
          <span className="font-bold text-pink-500">{PLANS[id].stars} ⭐</span>
        </div>
      ))}
      <p className="text-center text-xs text-muted">
        Payments activate in Phase 10 (Telegram Stars).
      </p>
    </main>
  );
}