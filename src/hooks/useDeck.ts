import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { DECK_BATCH } from "@/lib/utils/constants";
import type { Profile, ProfileWithPhotos } from "@/types";

export function useDeck(me: Profile | null) {
  const [deck, setDeck] = useState<ProfileWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(
    async (excludeIds: string[]) => {
      if (!me) return [];

      // 1. Fetch blocked users
      const { data: blocks } = await getSupabase()
        .from("blocks").select("blocked_id").eq("blocker_id", me.id);
      const blockedIds = (blocks ?? []).map((b) => b.blocked_id);

      // 2. Fetch acted users (likes/passes)
      const { data: acted } = await getSupabase()
        .from("likes").select("to_user_id").eq("from_user_id", me.id);
      const actedIds = (acted ?? []).map((row) => row.to_user_id) as string[];

      const exclude = [...excludeIds, ...actedIds, ...blockedIds];

      let query = getSupabase()
        .from("profiles")
        .select("*, profile_photos!inner(id, photo_url, is_primary, moderation_status)")
        .eq("onboarding_completed", true)
        .eq("is_banned", false)
        .neq("id", me.id)
        .eq("city", me.city)
        .eq("profile_photos.is_primary", true)
        .eq("profile_photos.moderation_status", "approved")
        .or(`interested_in.eq.${me.gender},interested_in.eq.everyone`)
        .order("last_active_at", { ascending: false })
        .limit(DECK_BATCH);

      if (me.interested_in !== "everyone") query = query.eq("gender", me.interested_in);
      if (exclude.length > 0) query = query.not("id", "in", `(${exclude.join(",")})`);

      const { data } = await query;
      const fresh = (data ?? []) as ProfileWithPhotos[];

      // Boost sort
      const nowTs = Date.now();
      fresh.sort((a, b) => {
        const ab = a.boosted_until ? new Date(a.boosted_until).getTime() > nowTs : false;
        const bb = b.boosted_until ? new Date(b.boosted_until).getTime() > nowTs : false;
        if (ab !== bb) return ab ? -1 : 1;
        return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime();
      });

      return fresh;
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
    init();
    return () => { active = false; };
  }, [me, fetchCards]);

  const removeCard = useCallback(async (id: string) => {
    const nextCards = deck.filter((p) => p.id !== id);
    setDeck(nextCards);
    if (nextCards.length > 0 && nextCards.length < 3) {
      const fresh = await fetchCards(nextCards.map((p) => p.id));
      if (fresh.length > 0) setDeck((current) => [...current, ...fresh.filter((f) => !current.some((c) => c.id === f.id))]);
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