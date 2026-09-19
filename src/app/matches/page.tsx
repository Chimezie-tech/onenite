"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import AdBanner from "@/components/ads/AdBanner";
import { getSupabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { chatTimestamp, truncate } from "@/lib/utils/helpers";
import type { Message, Profile } from "@/types";

interface MatchProfile extends Profile {
  profile_photos: { photo_url: string; is_primary: boolean; moderation_status: string }[];
}
interface MatchRow {
  id: string;
  last_message_at: string;
  u1: MatchProfile;
  u2: MatchProfile;
}

function primaryPhoto(p: MatchProfile): string | null {
  const approved = p.profile_photos.filter((x) => x.moderation_status === "approved");
  return (approved.find((x) => x.is_primary) ?? approved[0])?.photo_url ?? p.photo_url;
}

export default function MatchesPage() {
  const { profile } = useUserStore();
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [lastByMatch, setLastByMatch] = useState<Record<string, Message>>({});
  const [unreadByMatch, setUnreadByMatch] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    async function load() {
      if (!profile) return;
      const { data } = await getSupabase()
        .from("matches")
        .select(
          `id, last_message_at,
           u1:profiles!matches_user1_id_fkey(*, profile_photos(photo_url, is_primary, moderation_status)),
           u2:profiles!matches_user2_id_fkey(*, profile_photos(photo_url, is_primary, moderation_status))`
        )
        .eq("status", "active")
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
        .order("last_message_at", { ascending: false });

      const matchRows = (data ?? []) as unknown as MatchRow[];
      const ids = matchRows.map((r) => r.id);

      let msgs: Message[] = [];
      if (ids.length > 0) {
        const { data: messages } = await getSupabase()
          .from("messages")
          .select("id, match_id, sender_id, content, created_at, read_at")
          .in("match_id", ids)
          .order("created_at", { ascending: false })
          .limit(500);
        msgs = (messages ?? []) as Message[];
      }

      const last: Record<string, Message> = {};
      const unread: Record<string, number> = {};
      for (const row of matchRows) {
        const mine = msgs.filter((m) => m.match_id === row.id);
        if (mine[0]) last[row.id] = mine[0];
        unread[row.id] = mine.filter((m) => m.sender_id !== profile.id && !m.read_at).length;
      }

      if (active) {
        setRows(matchRows);
        setLastByMatch(last);
        setUnreadByMatch(unread);
        setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [profile]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-3 p-4 pb-24">
      <p className="flex items-center gap-2 text-lg font-bold text-ink">
        <MessageCircle className="h-5 w-5 text-pink-500" /> Chats
      </p>
      <AdBanner placement="chat" />

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="font-semibold text-ink">No matches yet</p>
          <p className="mt-1 text-sm text-muted">Keep swiping — conversations appear here.</p>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-pink-500 px-5 py-2 text-sm font-bold text-white">
            Start Swiping
          </Link>
        </div>
      ) : (
        rows.map((row) => {
          const other = row.u1.id === profile?.id ? row.u2 : row.u1;
          const last = lastByMatch[row.id];
          const unread = unreadByMatch[row.id] ?? 0;
          return (
            <Link
              key={row.id}
              href={`/matches/${row.id}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
            >
              <img
                src={primaryPhoto(other) ?? "/fallback-avatar.png"}
                alt={other.first_name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{other.first_name}</p>
                <p className="truncate text-xs text-muted">
                  {last
                    ? `${last.sender_id === profile?.id ? "You: " : ""}${truncate(last.content, 40)}`
                    : "Say hello 👋"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {last && <span className="text-[10px] text-muted">{chatTimestamp(last.created_at)}</span>}
                {unread > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
            </Link>
          );
        })
      )}
    </main>
  );
}