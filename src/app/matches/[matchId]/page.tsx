"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import AdBanner from "@/components/ads/AdBanner";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import PremiumBadge from "@/components/ui/PremiumBadge";
import { getSupabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
import { isOnline } from "@/lib/realtime/presence";
import { timeAgo } from "@/lib/utils/helpers";
import type { Message, Profile } from "@/types";

export default function ChatThreadPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();
  const { profile } = useUserStore();

  const [other, setOther] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState(false);
  const [typing, setTyping] = useState(false);
  const [notice, setNotice] = useState("");
  const [online, setOnline] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingSentAt = useRef(0);
  const typingHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    const client = getSupabase();

    async function markRead() {
      const { error } = await client
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("match_id", matchId)
        .neq("sender_id", profile?.id ?? "")
        .is("read_at", null);
      if (error) console.error("[chat] mark-read failed:", error.message);
    }

    async function refreshPresence(otherId: string) {
      const { data } = await client
        .from("profiles").select("last_active_at").eq("id", otherId).maybeSingle();
      if (active && data) setOnline(isOnline(data.last_active_at));
    }

    async function init() {
      if (!profile) return;
      const { data: match } = await client
        .from("matches").select("*").eq("id", matchId).maybeSingle();
      if (!match) { setReady(true); return; }

      const otherId = match.user1_id === profile.id ? match.user2_id : match.user1_id;
      const { data: otherProfile } = await client
        .from("profiles").select("*").eq("id", otherId).maybeSingle();
      const { data: msgs } = await client
        .from("messages").select("*").eq("match_id", matchId)
        .order("created_at", { ascending: true }).limit(200);

      if (!active) return;
      setOther((otherProfile as Profile) ?? null);
      setMessages((msgs ?? []) as Message[]);
      setOnline(isOnline((otherProfile as Profile | null)?.last_active_at));
      setReady(true);

      await markRead();

      // Presence refresh every 60s while the thread is open
      const presenceTimer = setInterval(() => void refreshPresence(otherId), 60_000);

      channelRef.current = client
        .channel(`chat-${matchId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          async (payload) => {
            const msg = payload.new as Message;
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            if (msg.sender_id !== profile.id) {
              const { error } = await client
                .from("messages").update({ read_at: new Date().toISOString() }).eq("id", msg.id);
              if (error) console.error("[chat] mark-read (live) failed:", error.message);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const msg = payload.new as Message;
            setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
          }
        )
        .on("broadcast", { event: "typing" }, (payload) => {
          const sender = (payload.payload as { userId?: string }).userId;
          if (sender && sender !== profile.id) {
            setTyping(true);
            if (typingHideTimer.current) clearTimeout(typingHideTimer.current);
            typingHideTimer.current = setTimeout(() => setTyping(false), 2000);
          }
        })
        .subscribe();

      // cleanup stored on the channel object's parent scope
      (channelRef.current as unknown as { _presenceTimer?: number })._presenceTimer =
        presenceTimer as unknown as number;
    }

    void init();
    window.addEventListener("focus", markRead);
    return () => {
      active = false;
      window.removeEventListener("focus", markRead);
      if (channelRef.current) void client.removeChannel(channelRef.current);
    };
  }, [profile, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function send(content: string) {
    if (!profile) return;
    const { error } = await getSupabase()
      .from("messages")
      .insert({ match_id: matchId, sender_id: profile.id, content });
    if (error) {
      if (error.message.includes("DAILY_MESSAGE_LIMIT")) {
        setNotice("Daily message limit reached (free: 100/day). Premium removes it.");
      } else {
        console.error(error);
      }
    }
  }

  function notifyTyping() {
    const now = Date.now();
    if (now - typingSentAt.current < 1200) return;
    typingSentAt.current = now;
    void channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: profile?.id },
    });
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app text-ink">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!other) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app p-6 text-center">
        <p className="font-semibold text-ink">Conversation not found</p>
        <Link href="/matches" className="text-sm text-pink-500">Back to chats</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <style>{`
        @keyframes ct-bounce { 0%,60%,100% { transform: translateY(0); opacity:.4; } 30% { transform: translateY(-4px); opacity:1; } }
        .ct-dot { animation: ct-bounce 1s infinite; }
        .ct-dot:nth-child(2) { animation-delay: .15s; }
        .ct-dot:nth-child(3) { animation-delay: .3s; }
      `}</style>

      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface p-3">
        <button type="button" aria-label="Back" onClick={() => router.push("/matches")} className="text-ink">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {other.photo_url ? (
          <img src={other.photo_url} alt={other.first_name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/20 text-sm font-bold text-pink-500">
            {other.first_name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-semibold text-ink">
            {other.first_name}
            {other.is_premium && <PremiumBadge />}
          </p>
          <p className={`text-xs ${online ? "font-medium text-emerald-500" : "text-muted"}`}>
            {online ? "● Online" : `Active ${timeAgo(other.last_active_at)}`}
          </p>
        </div>
      </header>

      <div className="p-3">
        <AdBanner placement="chat" />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3 pb-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-xs text-muted">
            You matched with {other.first_name} — break the ice 👋
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} mine={m.sender_id === profile?.id} />
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="flex gap-1.5 rounded-3xl rounded-bl-md bg-surface px-4 py-3.5">
              <span className="ct-dot h-2 w-2 rounded-full bg-muted" />
              <span className="ct-dot h-2 w-2 rounded-full bg-muted" />
              <span className="ct-dot h-2 w-2 rounded-full bg-muted" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {notice && <p className="px-3 pb-1 text-center text-xs text-red-500">{notice}</p>}
      <ChatInput onSend={send} onTyping={notifyTyping} />
    </div>
  );
}