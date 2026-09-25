"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { timeAgo } from "@/lib/utils/helpers";
import PremiumBadge from "@/components/ui/PremiumBadge";
import type { Message, Profile } from "@/types";

interface Row {
  matchId: string;
  other: Profile;
  last?: Message;
  unread: number;
}

const NIL = "00000000-0000-0000-0000-000000000000";

export default function MatchesPage() {
  const { profile } = useUserStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    async function load() {
      const me = profile!.id;
      const client = getSupabase();
      const { data: matches } = await client
        .from("matches").select("*")
        .or(`user1_id.eq.${me},user2_id.eq.${me}`)
        .order("last_message_at", { ascending: false });

      const list = matches ?? [];
      const otherIds = list.map((m) => (m.user1_id === me ? m.user2_id : m.user1_id));
      const matchIds = list.map((m) => m.id);

      const { data: profiles } = await client
        .from("profiles").select("*")
        .in("id", otherIds.length ? otherIds : [NIL]);
      const { data: msgs } = await client
        .from("messages").select("*")
        .in("match_id", matchIds.length ? matchIds : [NIL])
        .order("created_at", { ascending: false }).limit(500);

      if (!active) return;

      const lastByMatch = new Map<string, Message>();
      const unreadByMatch = new Map<string, number>();
      for (const m of (msgs ?? []) as Message[]) {
        if (!lastByMatch.has(m.match_id)) lastByMatch.set(m.match_id, m);
        if (m.sender_id !== me && !m.read_at) {
          unreadByMatch.set(m.match_id, (unreadByMatch.get(m.match_id) ?? 0) + 1);
        }
      }

      setRows(
        list
          .map((mt) => ({
            matchId: mt.id,
            other: (profiles ?? []).find((p) => p.id === (mt.user1_id === me ? mt.user2_id : mt.user1_id)) as Profile,
            last: lastByMatch.get(mt.id),
            unread: unreadByMatch.get(mt.id) ?? 0,
          }))
          .filter((r) => r.other)
      );
      setReady(true);
    }
    void load();
    return () => { active = false; };
  }, [profile]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-app pb-24">
      <div className="flex items-center gap-2 p-4 pb-2">
        <MessageCircle className="h-5 w-5 text-pink-500" />
        <p className="text-lg font-bold text-ink">Chats</p>
        {rows.length > 0 && (
          <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-xs font-bold text-pink-500">{rows.length}</span>
        )}
      </div>

      {!ready ? (
        <p className="p-6 text-center text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-sm font-semibold text-ink">No conversations yet</p>
          <p className="text-xs text-muted">Match with someone — or go Premium to message anyone directly.</p>
          <Link href="/premium" className="mt-2 rounded-full bg-pink-500 px-4 py-2 text-xs font-bold text-white">
            Explore Premium 💎
          </Link>
        </div>
      ) : (
        <div className="flex flex-col">
          {rows.map((r) => (
            <Link
              key={r.matchId}
              href={`/matches/${r.matchId}`}
              className="flex items-center gap-3 border-b border-line px-4 py-3 transition-colors hover:bg-surface last:border-0"
            >
              {r.other.photo_url ? (
                <img src={r.other.photo_url} alt={r.other.first_name} className="h-13 w-13 h-[52px] w-[52px] rounded-full object-cover" />
              ) : (
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-pink-500/20 text-lg font-bold text-pink-500">
                  {r.other.first_name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold text-ink">
                    {r.other.first_name}
                    {r.other.is_premium && <PremiumBadge />}
                  </p>
                  {r.last && <span className="shrink-0 text-[10px] text-muted">{timeAgo(r.last.created_at)}</span>}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted">
                    {r.last
                      ? `${r.last.sender_id === profile?.id ? "You: " : ""}${r.last.content}`
                      : r.other.city
                      ? `New match in ${r.other.city} — say hi 👋`
                      : "New match — say hi 👋"}
                  </p>
                  {r.unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-pink-500 px-1.5 text-[10px] font-bold text-white">
                      {r.unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}