"use client";
import { useUserStore } from "@/store/useUserStore";
import ThemeToggle from "@/components/layout/ThemeToggle";
import AdCarousel from "@/components/ads/AdCarousel";

export default function Home() {
  const { profile } = useUserStore();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-24">
      <ThemeToggle />
      <AdCarousel />
      <h1 className="text-center text-2xl font-bold text-ink">Welcome back, {profile?.first_name}! 🎉</h1>
      <p className="text-center text-muted">You are logged in. The Swipe Deck goes here in Phase 7.</p>
      <div className="p-4 rounded-lg border border-line bg-surface text-left text-sm text-ink">
        <p>ID: {profile?.id}</p>
        <p>City: {profile?.city || "Not set"}</p>
        <p>Premium: {profile?.is_premium ? "Yes" : "No"}</p>
      </div>
    </main>
  );
}