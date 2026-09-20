"use client";
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { getSupabase, getToken } from "@/lib/supabase/client";
import { getTelegramWebApp } from "@/lib/telegram/sdk";
import { isPremiumActive } from "@/lib/premium";
import { useUserStore } from "@/store/useUserStore";
import { PLANS } from "@/lib/utils/constants";

const FEATURES = [
  "Unlimited likes every day",
  "5 super likes daily",
  "See everyone who likes you",
  "Blue premium badge on your profile",
];

export default function PremiumPage() {
  const { profile, patchProfile } = useUserStore();
  const [busy, setBusy] = useState<"weekly" | "monthly" | null>(null);
  const [message, setMessage] = useState("");

  const premium = isPremiumActive(profile);

  useEffect(() => {
    // keep expiry fresh if they navigate back after paying
    if (!profile) return;
    let active = true;
    async function refresh() {
      const { data } = await getSupabase().from("profiles").select("*").eq("id", profile?.id ?? "").maybeSingle();
      if (active && data) patchProfile(data);
    }
    void refresh();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buy(plan: "weekly" | "monthly") {
    setMessage("");
    const tg = getTelegramWebApp();
    if (!tg) { setMessage("Open this page inside Telegram to pay."); return; }
    setBusy(plan);
    try {
      const res = await fetch("/api/payments/stars/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken() ?? ""}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { invoiceLink?: string; error?: string };
      if (!res.ok || !data.invoiceLink) throw new Error(data.error ?? "Invoice failed");

      tg.openInvoice(data.invoiceLink, async (status) => {
        setBusy(null);
        if (status === "paid") {
          setMessage("Payment received! Activating your Premium… 💎");
          // webhook activates it; refetch shortly
          setTimeout(async () => {
            const { data: fresh } = await getSupabase()
              .from("profiles").select("*").eq("id", profile?.id ?? "").maybeSingle();
            if (fresh) patchProfile(fresh);
          }, 2500);
        } else if (status === "cancelled") {
          setMessage("Payment cancelled.");
        } else {
          setMessage("Payment could not be completed.");
        }
      });
    } catch (err) {
      setBusy(null);
      setMessage(err instanceof Error ? err.message : "Payment error");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-24">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
        <Sparkles className="h-5 w-5 text-pink-500" /> OneNite Premium
      </h1>

      {premium && profile?.premium_expires_at && (
        <p className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-3 text-center text-xs font-semibold text-sky-500">
          💎 Premium active until {new Date(profile.premium_expires_at).toDateString()}
        </p>
      )}

      <ul className="flex flex-col gap-2 text-sm text-ink">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-pink-500" /> {f}
          </li>
        ))}
      </ul>

      {(Object.keys(PLANS) as Array<"weekly" | "monthly">).map((id) => (
        <div key={id} className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold capitalize text-ink">{id}</p>
              <p className="text-xs text-muted">
                {PLANS[id].stars} ⭐ · renews automatically until cancelled
              </p>
            </div>
            {id === "monthly" && (
              <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                BEST VALUE
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => buy(id)}
            className="mt-3 w-full rounded-xl bg-pink-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy === id ? "Opening Telegram…" : `Subscribe — ${PLANS[id].stars} ⭐`}
          </button>
        </div>
      ))}

      {message && <p className="text-center text-xs text-ink">{message}</p>}
      <p className="text-center text-[11px] text-muted">
        Subscriptions are managed by Telegram: Settings → My Payments → cancel anytime.
      </p>
    </main>
  );
}