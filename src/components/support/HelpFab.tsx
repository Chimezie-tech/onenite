"use client";
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { getToken } from "@/lib/supabase/client";

const TOPICS = [
  "Report a user", "Payment issue", "Photo or profile issue",
  "Bug or glitch", "Safety concern", "Other help",
];

export default function HelpFab() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [reported, setReported] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    const res = await fetch("/api/support/ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken() ?? ""}`,
      },
      body: JSON.stringify({ topic, message, reportedUsername: reported || null }),
    });
    if (res.ok) { setSent(true); setMessage(""); setReported(""); }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Help or report"
        onClick={() => { setOpen(true); setSent(false); }}
        className="fixed bottom-20 right-3 z-40 rounded-full border border-line bg-surface p-2.5 text-pink-500 shadow-lg"
      >
        <LifeBuoy className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-4">
            <p className="font-bold text-ink">Help & Reports 🛟</p>
            {sent ? (
              <p className="mt-3 text-sm text-muted">Ticket received — our team will respond in your Telegram chat. ✅</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <select className="rounded-lg border border-line bg-field p-2 text-sm text-ink"
                  value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {topic === "Report a user" && (
                  <input className="rounded-lg border border-line bg-field p-2 text-sm text-ink"
                    placeholder="@username of the user"
                    value={reported} onChange={(e) => setReported(e.target.value)} />
                )}
                <textarea className="h-20 rounded-lg border border-line bg-field p-2 text-sm text-ink"
                  placeholder="Describe the issue…"
                  value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
            )}
            <div className="mt-3 flex gap-2">
              {!sent && (
                <button type="button" disabled={!message.trim()} onClick={() => void submit()}
                  className="flex-1 rounded-lg bg-pink-500 py-2 text-xs font-bold text-white disabled:opacity-40">
                  Submit
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}