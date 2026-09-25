import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { DECK_BATCH } from "@/lib/utils/constants";
import type { Profile, ProfileWithPhotos } from "@/types";

type Scope = "city" | "country" | "global";

export function useDeck(me: Profile | null) {
  const [deck, setDeck] = useState<ProfileWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(
    async (excludeIds: string[]) => {
      if (!me) return [];

      const { data: blocks } = await getSupabase()
        .from("blocks").select("blocked_id").eq("blocker_id", me.id);
      const { data: acted } = await getSupabase()
        .from("likes").select("to_user_id").eq("from_user_id", me.id);

      const exclude = [
        ...excludeIds,
        ...((acted ?? []).map((r) => r.to_user_id) as string[]),
        ...((blocks ?? []).map((b) => b.blocked_id) as string[]),
      ];

      async function runScope(scope: Scope): Promise<ProfileWithPhotos[]> {
        let q = getSupabase()
          .from("profiles")
          .select("*, profile_photos(id, photo_url, is_primary, moderation_status)")
          .eq("onboarding_completed", true)
          .eq("is_banned", false)
          .neq("id", me!.id)
          .eq("profile_photos.moderation_status", "approved")
          .or(`interested_in.eq.${me!.gender},interested_in.eq.everyone`)
          .order("last_active_at", { ascending: false })
          .limit(DECK_BATCH);

        if (scope === "city") q = q.eq("city", me!.city);
        if (scope === "country") q = q.eq("country", me!.country).neq("city", me!.city);
        if (scope === "global")
          q = q.or(`country.neq.${me!.country ?? "NONE"},country.is.null`).neq("city", me!.city);

        if (me!.interested_in !== "everyone") q = q.eq("gender", me!.interested_in);
        if (exclude.length > 0) q = q.not("id", "in", `(${exclude.join(",")})`);

        const { data } = await q;
        return (data ?? []) as ProfileWithPhotos[];
      }

      // Progressive radius: city → country → global
      const cards = await runScope("city");
      if (cards.length < 3) {
        const seen = new Set(cards.map((c) => c.id));
        for (const extra of await runScope("country")) {
          if (!seen.has(extra.id)) { cards.push(extra); seen.add(extra.id); }
        }
      }
      if (cards.length < 3) {
        const seen = new Set(cards.map((c) => c.id));
        for (const extra of await runScope("global")) {
          if (!seen.has(extra.id)) { cards.push(extra); seen.add(extra.id); }
        }
      }

      const nowTs = Date.now();
      cards.sort((a, b) => {
        const ab = a.boosted_until ? new Date(a.boosted_until).getTime() > nowTs : false;
        const bb = b.boosted_until ? new Date(b.boosted_until).getTime() > nowTs : false;
        if (ab !== bb) return ab ? -1 : 1;
        return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime();
      });

      return cards;
    },
    [me]
  );

  useEffect(() => {
    let active = true;
    async function init() {
      if (!me) return;
      const cards = await fetchCards([]);
      if (active) { setDeck(cards); setLoading(false); }
    }
    void init();
    return () => { active = false; };
  }, [me, fetchCards]);

  const removeCard = useCallback(async (id: string) => {
    const nextCards = deck.filter((p) => p.id !== id);
    setDeck(nextCards);
    if (nextCards.length > 0 && nextCards.length < 3) {
      const fresh = await fetchCards(nextCards.map((p) => p.id));
      if (fresh.length > 0) {
        setDeck((current) => [...current, ...fresh.filter((f) => !current.some((c) => c.id === f.id))]);
      }
    }
  }, [deck, fetchCards]);

  const reload = useCallback(async () => {
    setLoading(true);
    const cards = await fetchCards([]);
    setDeck(cards);
    setLoading(false);
  }, [fetchCards]);

  return { deck, loading, removeCard, reload };
}