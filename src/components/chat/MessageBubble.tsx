import { chatTimestamp } from "@/lib/utils/helpers";
import type { Message } from "@/types";

interface Props {
  message: Message;
  mine: boolean;
}

export default function MessageBubble({ message, mine }: Props) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          mine ? "rounded-br-sm bg-pink-500 text-white" : "rounded-bl-sm bg-field text-ink"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            mine ? "text-white/80" : "text-muted"
          }`}
        >
          {chatTimestamp(message.created_at)}
          {mine && (message.read_at ? " ✓✓" : " ✓")}
        </p>
      </div>
    </div>
  );
}