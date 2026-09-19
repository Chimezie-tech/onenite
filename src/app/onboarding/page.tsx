"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button"; // We'll create a simple button next
import { Loader2 } from "lucide-react";
import type { Gender } from "@/types";

/** Runtime validator: only accepts real Gender values */
function isGender(value: string): value is Gender {
  return value === "male" || value === "female" || value === "other";
}

export default function OnboardingPage() {
  const { profile, patchProfile } = useUserStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<Gender>("male");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!age || !city) return alert("Please fill in all fields");

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          age,
          gender,
          city,
          bio,
          onboarding_completed: true,
        })
        .eq("id", profile?.id);

      if (error) throw error;

      // Update local state
      patchProfile({ age, gender, city, bio, onboarding_completed: true });
      
      // Go to the main app (swipe deck)
      router.replace("/");
    } catch (err) {
      alert("Error saving profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-md mx-auto min-h-screen justify-center">
      <h1 className="text-3xl font-bold text-center mb-2">Welcome to OneNite 👋</h1>
      <p className="text-center text-gray-400 mb-6">
        Tell us a bit about yourself to get started.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Age: {age}</label>
          <input 
            type="range" min="18" max="60" value={age} 
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full accent-pink-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Gender</label>
         <select
            value={gender}
            onChange={(e) => {
                const value = e.target.value;
                if (isGender(value)) setGender(value);
            }}
            className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
            >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Your City</label>
          <input 
            type="text" placeholder="e.g., Lagos, Nairobi, Accra"
            value={city} onChange={(e) => setCity(e.target.value)}
            className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Short Bio</label>
          <textarea 
            placeholder="What are you looking for?"
            value={bio} onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white h-24"
          />
        </div>

        <Button type="submit" disabled={loading} className="mt-4">
          {loading ? <Loader2 className="animate-spin" /> : "Start Swiping ❤️"}
        </Button>
      </form>
    </div>
  );
}