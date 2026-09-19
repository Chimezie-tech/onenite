"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { getSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import ThemeToggle from "@/components/layout/ThemeToggle";
import type { Gender } from "@/types";

function isGender(value: string): value is Gender {
  return value === "male" || value === "female" || value === "other";
}

const FIELD = "p-3 rounded-lg bg-field border border-line text-ink";

export default function OnboardingPage() {
  const { profile, patchProfile } = useUserStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<Gender>("male");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    const { error } = await getSupabase()
      .from("profiles")
      .update({ age, gender, city, bio, onboarding_completed: true })
      .eq("id", profile.id);
    setLoading(false);

    if (error) {
      console.error("Onboarding update failed:", error);
      alert(`Error saving profile: ${error.message}`);
      return;
    }
    patchProfile({ age, gender, city, bio, onboarding_completed: true });
    router.replace("/");
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-md mx-auto min-h-screen justify-center">
      <ThemeToggle />
      <h1 className="text-3xl font-bold text-center mb-2 text-ink">Welcome to OneNite 👋</h1>
      <p className="text-center text-muted mb-6">Tell us a bit about yourself to get started.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted">Age: {age}</label>
          <input
            type="range" min="18" max="60" value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full accent-pink-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted">Gender</label>
          <select
            value={gender}
            onChange={(e) => {
              const value = e.target.value;
              if (isGender(value)) setGender(value);
            }}
            className={FIELD}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted">Your City</label>
          <input
            type="text" placeholder="e.g., Lagos, Nairobi, Accra"
            value={city} onChange={(e) => setCity(e.target.value)}
            className={FIELD}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted">Short Bio</label>
          <textarea
            placeholder="What are you looking for?"
            value={bio} onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            className={`${FIELD} h-24`}
          />
        </div>

        <Button type="submit" disabled={loading} className="mt-4">
          {loading ? <Loader2 className="animate-spin" /> : "Start Swiping ❤️"}
        </Button>
      </form>
    </div>
  );
}