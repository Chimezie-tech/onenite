"use client";
import { useUserStore } from "@/store/useUserStore";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function Home() {
  const { profile } = useUserStore();

  return (
    <main className="p-6 text-center">
      <ThemeToggle />
      <h1 className="text-2xl font-bold mt-10 text-ink">Welcome back, {profile?.first_name}! 🎉</h1>
      <p className="text-muted mt-2">You are logged in. The Swipe Deck goes here in Phase 6.</p>
      <div className="mt-6 p-4 bg-surface border border-line rounded-lg text-left text-sm text-ink">
        <p>ID: {profile?.id}</p>
        <p>City: {profile?.city || "Not set"}</p>
        <p>Premium: {profile?.is_premium ? "Yes" : "No"}</p>
      </div>
    </main>
  );
}