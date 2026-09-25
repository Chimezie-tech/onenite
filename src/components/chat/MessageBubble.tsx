"use client";
import type { Message } from "@/types";

interface Props {
  message: Message & { read_at?: string | null };
  mine: boolean;
}

export default function MessageBubble({ message, mine }: Props) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-3xl px-4 py-2.5 text-sm shadow-sm ${
          mine
            ? "rounded-br-md bg-pink-500 text-white"
            : "rounded-bl-md bg-surface text-ink"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`mt-1 text-right text-[10px] ${mine ? "text-white/70" : "text-muted"}`}>
          {time}
          {mine && (message.read_at ? " ✓✓" : " ✓")}
        </p>
      </div>
    </div>
  );
}