import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";

interface Badges {
  likesReceived: number;   // pending likes (people I haven't liked back yet)
  unreadMessages: number;  // lights up in Phase 9
}

export function useBadges(): Badges {
  const { profile } = useUserStore();
  const [badges, setBadges] = useState<Badges>({ likesReceived: 0, unreadMessages: 0 });

  useEffect(() => {
    if (!profile) return;
    let active = true;

    async function load() {
      if (!profile) return;

      // People I already liked back are matches, not pending likes
      const { data: mine } = await getSupabase()
        .from("likes").select("to_user_id")
        .eq("from_user_id", profile.id).eq("is_pass", false);
      const likedByMe = (mine ?? []).map((row) => row.to_user_id);

      let likesQuery = getSupabase()
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", profile.id)
        .eq("is_pass", false);
      if (likedByMe.length > 0) {
        likesQuery = likesQuery.not("from_user_id", "in", `(${likedByMe.join(",")})`);
      }

      const [{ count: likesCount }, { count: unreadCount }] = await Promise.all([
        likesQuery,
        getSupabase()
          .from("messages")
          .select("*", { count: "exact", head: true })
          .neq("sender_id", profile.id)
          .is("read_at", null),
      ]);

      if (active) {
        setBadges({ likesReceived: likesCount ?? 0, unreadMessages: unreadCount ?? 0 });
      }
    }

    void load();
    const timer = setInterval(() => void load(), 30000); // stopgap until Phase 9 realtime
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [profile]);

  return badges;
}