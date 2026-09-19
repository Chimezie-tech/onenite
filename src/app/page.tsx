"use client";
import { useUserStore } from "@/store/useUserStore";

export default function Home() {
  const { profile } = useUserStore();

  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl font-bold mt-10">Welcome back, {profile?.first_name}! 🎉</h1>
      <p className="text-gray-400 mt-2">You are logged in. The Swipe Deck goes here in Phase 6.</p>
      <div className="mt-6 p-4 bg-gray-900 rounded-lg text-left text-sm">
        <p>ID: {profile?.id}</p>
        <p>City: {profile?.city || "Not set"}</p>
        <p>Premium: {profile?.is_premium ? "Yes" : "No"}</p>
      </div>
    </main>
  );
}