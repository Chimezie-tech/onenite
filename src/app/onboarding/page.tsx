"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import { InterestChips, SingleChips } from "@/components/onboarding/ChipSelect";
import { Button } from "@/components/ui/Button";
import { getSupabase } from "@/lib/supabase/client";
import { getTelegramWebApp } from "@/lib/telegram/sdk";
import { useUserStore } from "@/store/useUserStore";
import { profileScore } from "@/lib/utils/profileScore";
import { INTEREST_GROUPS, PROFILE_CATEGORIES } from "@/lib/utils/constants";
import type { Gender, InterestedIn, Profile } from "@/types";

const STEPS = ["Basics", "Attraction", "Lifestyle", "Mind & Life", "Interests", "Bio & Review"];
const FIELD = "w-full rounded-lg border border-line bg-field p-3 text-sm text-ink";

function isGender(v: string): v is Gender { return v === "male" || v === "female" || v === "other"; }
function isInterested(v: string): v is InterestedIn { return v === "male" || v === "female" || v === "everyone"; }

export default function OnboardingPage() {
  const { profile, patchProfile } = useUserStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<Gender>("male");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [interestedIn, setInterestedIn] = useState<InterestedIn>("everyone");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [occupation, setOccupation] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [bio, setBio] = useState("");

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function useMyLocation() {
    const tg = getTelegramWebApp();
    if (!tg?.LocationManager) return;
    setLocating(true);
    tg.LocationManager.init(() => {
      tg.LocationManager.getLocation((loc) => {
        setLocating(false);
        if (!loc) return;
        void (async () => {
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${loc.latitude}&longitude=${loc.longitude}&localityLanguage=en`
            );
            const data = (await res.json()) as { city?: string; locality?: string; countryName?: string };
            setCity(data.city || data.locality || "");
            setCountry(data.countryName || "");
          } catch { /* manual entry remains */ }
        })();
      });
    });
  }

  const payload = {
    age, gender, city, country, bio,
    interested_in: interestedIn,
    orientation: answers.orientation ?? null,
    relationship_status: answers.relationship_status ?? null,
    drinking: answers.drinking ?? null,
    smoking: answers.smoking ?? null,
    nightlife: answers.nightlife ?? null,
    politics: answers.politics ?? null,
    religion: answers.religion ?? null,
    education: answers.education ?? null,
    kids: answers.kids ?? null,
    occupation: occupation || null,
    height_cm: heightCm ? Number(heightCm) : null,
    interests,
    onboarding_completed: true,
  };

  const previewScore = profile ? profileScore({ ...profile, ...payload } as Profile, 0) : 0;

  function next() {
    if (step === 0 && !city.trim()) { alert("Add your city — or tap 📍 to auto-detect."); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    if (!profile) return;
    setLoading(true);
    const { error } = await getSupabase()
      .from("profiles").update(payload).eq("id", profile.id);
    setLoading(false);
    if (error) { alert(`Error saving profile: ${error.message}`); return; }
    patchProfile(payload);
    router.replace("/");
  }

  const cats = (keys: string[]) =>
    PROFILE_CATEGORIES.filter((c) => keys.includes(c.key)).map((c) => (
      <SingleChips
        key={c.key}
        label={c.label}
        emoji={c.emoji}
        options={c.options}
        value={answers[c.key] ?? ""}
        onChange={(v) => setAnswer(c.key, v)}
      />
    ));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-4 pb-10">
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span className="font-semibold text-ink">{STEPS[step]}</span>
          <span>{step + 1}/{STEPS.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-field">
          <div
            className="h-1.5 rounded-full bg-pink-500 transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Age: {age}</label>
            <input type="range" min={18} max={60} value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-pink-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Gender</label>
            <select className={FIELD} value={gender}
              onChange={(e) => { const v = e.target.value; if (isGender(v)) setGender(v); }}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Your City</label>
            <input className={FIELD} placeholder="e.g., Lagos, Nairobi, Accra"
              value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <button type="button" onClick={useMyLocation} disabled={locating}
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface p-3 text-xs font-semibold text-ink disabled:opacity-50">
            <MapPin className="h-4 w-4 text-pink-500" />
            {locating ? "Detecting…" : "Use my current location"}
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Looking for</label>
            <select className={FIELD} value={interestedIn}
              onChange={(e) => { const v = e.target.value; if (isInterested(v)) setInterestedIn(v); }}>
              <option value="everyone">Everyone</option>
              <option value="female">Women</option>
              <option value="male">Men</option>
            </select>
          </div>
          {cats(["orientation", "relationship_status"])}
        </div>
      )}

      {step === 2 && <div className="flex flex-col gap-4">{cats(["drinking", "smoking", "nightlife", "kids"])}</div>}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          {cats(["religion", "politics", "education"])}
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Job / Occupation</label>
            <input className={FIELD} placeholder="e.g., Nurse, Developer, Trader"
              value={occupation} onChange={(e) => setOccupation(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Height (cm, optional)</label>
            <input className={FIELD} type="number" min={120} max={230} placeholder="e.g., 175"
              value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </div>
        </div>
      )}

      {step === 4 && <InterestChips groups={INTEREST_GROUPS} value={interests} onChange={setInterests} />}

      {step === 5 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Short Bio</label>
            <textarea className={`${FIELD} h-24`} maxLength={500}
              placeholder="What makes you, you?"
              value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm font-bold text-ink">Profile strength: {previewScore}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-field">
              <div className="h-1.5 rounded-full bg-pink-500" style={{ width: `${previewScore}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">
              Add 2+ photos on the Profile tab after signup to reach 100% — complete profiles get up to 3× more matches.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROFILE_CATEGORIES.filter((c) => answers[c.key]).map((c) => (
              <span key={c.key} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink">
                {c.emoji} {answers[c.key]}
              </span>
            ))}
            {interests.map((t) => (
              <span key={t} className="rounded-full bg-pink-500/15 px-2.5 py-1 text-[11px] font-medium text-pink-500">{t}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)}
            className="flex-1 rounded-xl border border-line py-3 text-sm font-semibold text-ink">
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next}
            className="flex-1 rounded-xl bg-pink-500 py-3 text-sm font-bold text-white">
            Next
          </button>
        ) : (
          <Button type="button" disabled={loading} onClick={submit}>
            {loading ? <Loader2 className="animate-spin" /> : "Finish & Start Swiping ❤️"}
          </Button>
        )}
      </div>
    </main>
  );
}