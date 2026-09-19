"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import AdBanner from "@/components/ads/AdBanner";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import { getSupabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";
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
      setReady(true);

      await markRead();

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
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", msg.id);
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
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface p-3">
        <button type="button" aria-label="Back" onClick={() => router.push("/matches")} className="text-ink">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="flex-1 text-sm font-bold text-ink">{other.first_name}</p>
        {typing && <span className="text-xs text-pink-500">typing…</span>}
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
        <div ref={bottomRef} />
      </div>

      {notice && <p className="px-3 pb-1 text-center text-xs text-red-500">{notice}</p>}
      <ChatInput onSend={send} onTyping={notifyTyping} />
    </div>
  );
}