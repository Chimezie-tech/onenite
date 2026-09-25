"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Heart, MapPin, MessageCircle, UserX, X } from "lucide-react";
import PremiumBadge from "@/components/ui/PremiumBadge";
import { getSupabase, getToken } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils/helpers";
import { isPremiumActive } from "@/lib/premium";
import { useUserStore } from "@/store/useUserStore";
import { INTEREST_GROUPS, PROFILE_CATEGORIES } from "@/lib/utils/constants";
import type { ProfilePhoto, ProfileWithPhotos, SwipeAction } from "@/types";

const GENDER_LABEL: Record<string, string> = { female: "Woman", male: "Man", other: "Non-binary" };
const LOOKING_LABEL: Record<string, string> = { male: "Men", female: "Women", everyone: "Everyone" };

interface Props {
  profile: ProfileWithPhotos | null;
  onClose: () => void;
  onAction: (action: SwipeAction) => void;
}

export default function ProfileDetail({ profile, onClose, onAction }: Props) {
  const router = useRouter();
  const { profile: me } = useUserStore();
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [paywall, setPaywall] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    const viewedId = profile.id;
    void fetch("/api/profile-views", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ viewedId }),
    });
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    const targetId = profile.id;
    async function load() {
      const { data } = await getSupabase()
        .from("profile_photos").select("*").eq("user_id", targetId)
        .eq("moderation_status", "approved")
        .order("is_primary", { ascending: false }).order("created_at", { ascending: true });
      if (active) { setPhotos((data ?? []) as ProfilePhoto[]); setPhotoIndex(0); }
    }
    void load();
    return () => { active = false; };
  }, [profile]);

  if (!profile) return null;
  const p = profile; // captured non-null for closures below

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setPhotoIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  async function handleBlock() {
    if (!window.confirm(`Block ${p.first_name}? They won't be able to see you or message you.`)) return;
    await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ blockedId: p.id }),
    });
    onClose();
  }

  async function startChat() {
    if (!me) return;
    setChatBusy(true);
    const client = getSupabase();
    const { data: existing } = await client
      .from("matches").select("*")
      .or(`and(user1_id.eq.${me.id},user2_id.eq.${p.id}),and(user1_id.eq.${p.id},user2_id.eq.${me.id})`)
      .maybeSingle();

    if (existing) {
      router.push(`/matches/${existing.id}`);
      return;
    }
    if (!isPremiumActive(me)) {
      setChatBusy(false);
      setPaywall(true);
      return;
    }
    const { data, error } = await client
      .from("matches")
      .insert({ user1_id: me.id, user2_id: p.id, status: "active", is_direct: true })
      .select().single();
    setChatBusy(false);
    if (error) { alert(`Could not open chat: ${error.message}`); return; }
    router.push(`/matches/${data.id}`);
  }

  const filledCats = PROFILE_CATEGORIES.filter((c) => p[c.key]);
  const ungrouped = p.interests.filter((t) => !INTEREST_GROUPS.some((g) => g.tags.includes(t)));
  const gallery = photos.length > 0 ? photos : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app">
      <div className="relative px-3 pt-3">
        {gallery ? (
          <div ref={scrollRef} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl">
            {gallery.map((ph) => (
              <img key={ph.id} src={ph.photo_url} alt={p.first_name} draggable={false}
                className="h-[210px] w-full shrink-0 snap-center rounded-2xl object-cover" />
            ))}
          </div>
        ) : p.photo_url ? (
          <img src={p.photo_url} alt={p.first_name}
            className="h-[210px] w-full rounded-2xl object-cover" />
        ) : (
          <div className="flex h-[210px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/30 via-purple-500/20 to-sky-500/30">
            <span className="text-6xl font-black text-white/60">{p.first_name.charAt(0)}</span>
          </div>
        )}
        <button type="button" aria-label="Back" onClick={onClose}
          className="absolute left-5 top-5 rounded-full bg-black/50 p-1.5 text-white">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Block user" onClick={() => void handleBlock()}
          className="absolute right-5 top-5 rounded-full bg-black/50 p-1.5 text-white">
          <UserX className="h-4 w-4" />
        </button>
        {gallery && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {gallery.map((ph, i) => (
              <span key={ph.id} className={`h-1 rounded-full ${i === photoIndex ? "w-3 bg-white" : "w-1 bg-white/50"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xl font-bold text-ink">{p.first_name}, {p.age}</h2>
          {p.is_premium && <PremiumBadge />}
          {p.is_verified && <BadgeCheck className="h-4 w-4 text-sky-500" />}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3" /> {p.city || "Nearby"}{p.country ? `, ${p.country}` : ""} · Active {timeAgo(p.last_active_at)}
        </p>
        {p.height_cm && <p className="mt-0.5 text-xs text-muted">📏 {p.height_cm} cm</p>}

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-line bg-surface p-2.5">
            <p className="text-[11px] text-muted">I am</p>
            <p className="text-xs font-semibold text-ink">{GENDER_LABEL[p.gender] ?? p.gender}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-2.5">
            <p className="text-[11px] text-muted">Looking for</p>
            <p className="text-xs font-semibold text-ink">{LOOKING_LABEL[p.interested_in] ?? p.interested_in}</p>
          </div>
        </div>

        {p.bio && (
          <>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">About</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{p.bio}</p>
          </>
        )}

        {p.occupation && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2">
            <span className="text-xs text-muted">💼 Work</span>
            <span className="rounded-full bg-field px-2.5 py-1 text-xs font-semibold text-ink">{p.occupation}</span>
          </div>
        )}

        {filledCats.length > 0 && (
          <>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">The details</h3>
            <div className="mt-2 flex flex-col gap-1.5">
              {filledCats.map((c) => (
                <div key={c.key} className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2">
                  <span className="text-xs text-muted">{c.emoji} {c.label}</span>
                  <span className="rounded-full bg-field px-2.5 py-1 text-xs font-semibold text-ink">{p[c.key]}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {p.interests.length > 0 && (
          <>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">Hobbies & Interests</h3>
            <div className="mt-2 flex flex-col gap-3">
              {INTEREST_GROUPS.map((g) => {
                const tags = p.interests.filter((t) => g.tags.includes(t));
                if (tags.length === 0) return null;
                return (
                  <div key={g.group}>
                    <p className="mb-1.5 text-xs font-semibold text-ink">{g.emoji} {g.group}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span key={t} className="rounded-full bg-pink-500/15 px-2.5 py-1 text-[11px] font-medium text-pink-500">{t}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {ungrouped.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ungrouped.map((t) => (
                    <span key={t} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 border-t border-line bg-surface/95 px-4 py-2 backdrop-blur">
        <button type="button" aria-label="Pass" onClick={() => onAction("pass")}
          className="rounded-full border border-line bg-app p-2.5 text-red-400">
          <X className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Message" disabled={chatBusy}
          onClick={() => void startChat()}
          className="flex items-center gap-1.5 rounded-full bg-pink-500 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
          <MessageCircle className="h-4 w-4" /> {chatBusy ? "Opening…" : "Message"}
        </button>
        <button type="button" aria-label="Like" onClick={() => onAction("like")}
          className="rounded-full border border-line bg-app p-2.5 text-pink-500">
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {paywall && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 text-center">
            <p className="text-3xl">💎</p>
            <p className="mt-2 font-bold text-ink">Message anyone — instantly</p>
            <p className="mt-1 text-xs text-muted">
              Direct messaging without a match is a Premium feature. Upgrade and skip the waiting game.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" onClick={() => { setPaywall(false); onClose(); router.push("/premium"); }}
                className="rounded-xl bg-pink-500 py-2.5 text-sm font-bold text-white">
                Go Premium ❤
              </button>
              <button type="button" onClick={() => setPaywall(false)}
                className="rounded-xl border border-line py-2.5 text-sm font-semibold text-ink">
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}