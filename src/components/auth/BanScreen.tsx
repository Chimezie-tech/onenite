"use client";
import { useState } from "react";
import { ShieldAlert, Send } from "lucide-react";
import { getToken } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";

export default function BanScreen() {
  const { profile } = useUserStore();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function appeal() {
    setBusy(true);
    const res = await fetch("/api/appeals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken() ?? ""}`,
      },
      body: JSON.stringify({ message }),
    });
    setBusy(false);
    if (res.ok) setSent(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-app p-6 text-center">
      <div className="mb-6 rounded-full bg-red-500/10 p-6">
        <ShieldAlert className="h-16 w-16 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-ink">Account Suspended</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Your account has been suspended for violating our community guidelines.
        {profile?.suspended_until && ` Suspension ends: ${new Date(profile.suspended_until).toLocaleDateString()}.`}
      </p>

      {!sent ? (
        <div className="mt-6 w-full max-w-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Appeal Decision</p>
          <textarea
            className="h-24 w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink"
            placeholder="Explain why this might be a mistake…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={appeal}
            disabled={busy || !message.trim()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : <><Send className="h-4 w-4" /> Send Appeal</>}
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-bold text-emerald-600">Appeal Received ✅</p>
          <p className="mt-1 text-xs text-muted">Our team will review your case and notify you via Telegram.</p>
        </div>
      )}
    </div>
  );
}