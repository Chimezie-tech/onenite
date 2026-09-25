"use client";
import { useState } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (content: string) => void | Promise<void>;
  onTyping: () => void;
}

export default function ChatInput({ onSend, onTyping }: Props) {
  const [value, setValue] = useState("");

  function submit() {
    const text = value.trim();
    if (!text) return;
    setValue("");
    void onSend(text);
  }

  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-line bg-surface p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <input
        className="flex-1 rounded-full border border-line bg-field px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
        placeholder="Message…"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onTyping();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <button
        type="button"
        aria-label="Send"
        onClick={submit}
        disabled={!value.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg shadow-pink-500/30 disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}