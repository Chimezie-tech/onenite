"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { MESSAGE_MAX_LENGTH } from "@/lib/utils/constants";

interface Props {
  onSend: (content: string) => void;
  onTyping: () => void;
}

export default function ChatInput({ onSend, onTyping }: Props) {
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  }

  return (
    <form
      onSubmit={submit}
      className="sticky bottom-0 flex items-center gap-2 border-t border-line bg-surface p-3"
    >
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onTyping();
        }}
        maxLength={MESSAGE_MAX_LENGTH}
        placeholder="Type a message…"
        className="flex-1 rounded-xl border border-line bg-field px-3 py-2 text-sm text-ink outline-none"
      />
      <button
        type="submit"
        aria-label="Send"
        disabled={!value.trim()}
        className="rounded-xl bg-pink-500 p-2.5 text-white disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}