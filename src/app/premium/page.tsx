"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import BackHeader from "@/components/layout/BackHeader";
import { getSupabase, getToken } from "@/lib/supabase/client";
import { getTelegramWebApp } from "@/lib/telegram/sdk";
import { isPremiumActive } from "@/lib/premium";
import { useUserStore } from "@/store/useUserStore";
import { CURRENCY_SYMBOLS, PLANS, ONE_TIME_ITEMS, BOOSTS } from "@/lib/utils/constants";

const FEATURES = [
  "Unlimited likes every day",
  "5 super likes daily",
  "See everyone who likes you",
  "Blue premium badge on your profile",
];

interface PriceInfo {
  stars: number;
  currency: string;
  payment_link: string | null;
}

export default function PremiumPage() {
  const { profile, patchProfile } = useUserStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [priceMap, setPriceMap] = useState<Record<string, PriceInfo>>({});
  const premium = isPremiumActive(profile);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/pricing");
      if (!res.ok) return;
      const rows = (await res.json()) as Array<{
        key: string;
        stars: number;
        currency: string;
        payment_link: string | null;
      }>;
      const m: Record<string, PriceInfo> = {};
      for (const r of rows) {
        m[r.key] = { stars: r.stars, currency: r.currency, payment_link: r.payment_link };
      }
      setPriceMap(m);
    })();
  }, []);

  async function refreshProfile() {
    if (!profile) return;
    const { data } = await getSupabase()
      .from("profiles").select("*").eq("id", profile.id).maybeSingle();
    if (data) patchProfile(data);
  }

  useEffect(() => {
    void refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function infoFor(key: string, fallbackStars: number): PriceInfo {
    return priceMap[key] ?? { stars: fallbackStars, currency: "stars", payment_link: null };
  }

  function label(info: PriceInfo): string {
    if (info.currency === "stars") return `${info.stars} ⭐`;
    return `${info.stars.toLocaleString()} ${CURRENCY_SYMBOLS[info.currency] ?? info.currency}`;
  }

  function openExternal(url: string) {
    const tg = getTelegramWebApp();
    if (tg) tg.openLink(url);
    else window.open(url, "_blank", "noopener");
  }

  async function checkout(body: Record<string, unknown>, busyKey: string, info: PriceInfo) {
    setMessage("");

    // Fiat mode: open the configured PayPal/Flutterwave link
    if (info.currency !== "stars") {
      if (!info.payment_link) {
        setMessage("Payment link not configured for this item yet.");
        return;
      }
      openExternal(info.payment_link);
      setMessage("Complete your payment in the opened checkout page.");
      return;
    }

    // Stars mode: native Telegram invoice
    const tg = getTelegramWebApp();
    if (!tg) {
      setMessage("Open this page inside Telegram to pay.");
      return;
    }
    setBusy(busyKey);
    try {
      const res = await fetch("/api/payments/stars/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken() ?? ""}`,
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { invoiceLink?: string; error?: string };
      if (!res.ok || !data.invoiceLink) throw new Error(data.error ?? "Invoice failed");

      tg.openInvoice(data.invoiceLink, (status) => {
        setBusy(null);
        if (status === "paid") {
          setMessage("Payment received! Applying your purchase… ✨");
          setTimeout(() => void refreshProfile(), 2500);
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

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const boostActive = profile?.boosted_until
    ? new Date(profile.boosted_until).getTime() > now
    : false;
  const revealActive = profile?.reveal_until
    ? new Date(profile.reveal_until).getTime() > now
    : false;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-24">
      <BackHeader title="OneNite Premium" />

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

      {(Object.keys(PLANS) as Array<"weekly" | "monthly">).map((id) => {
        const info = infoFor(`sub:${id}`, PLANS[id].stars);
        return (
          <div key={id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold capitalize text-ink">{id}</p>
                <p className="text-xs text-muted">
                  {label(info)} ·{" "}
                  {id === "monthly"
                    ? "renews automatically until cancelled"
                    : "one-time 7-day pass"}
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
              onClick={() =>
                void checkout({ kind: "subscription", plan: id }, `sub:${id}`, info)
              }
              className="mt-3 w-full rounded-xl bg-pink-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy === `sub:${id}`
                ? "Opening Telegram…"
                : info.currency === "stars"
                ? `Subscribe — ${label(info)}`
                : `Pay — ${label(info)}`}
            </button>
          </div>
        );
      })}

      <h2 className="mt-2 text-sm font-bold text-ink">Impulse Boosts</h2>

      {Object.values(BOOSTS).map((b) => {
        const info = infoFor(`boost:${b.id}`, b.stars);
        return (
          <div key={b.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{b.label}</p>
                <p className="text-xs text-muted">{b.description}</p>
              </div>
              <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-500">
                {label(info)}
              </span>
            </div>
            {boostActive && (
              <p className="mt-2 text-xs font-semibold text-amber-500">
                 Active until {new Date(profile?.boosted_until ?? "").toTimeString().slice(0, 5)}
              </p>
            )}
            <button
              type="button"
              disabled={busy !== null || boostActive}
              onClick={() => void checkout({ kind: "boost", boost: b.id }, `boost:${b.id}`, info)}
              className="mt-3 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy === `boost:${b.id}`
                ? "Opening…"
                : boostActive
                ? "Boost running…"
                : info.currency === "stars"
                ? `Boost me — ${label(info)}`
                : `Pay — ${label(info)}`}
            </button>
          </div>
        );
      })}

      {Object.values(ONE_TIME_ITEMS).map((item) => {
        const info = infoFor(`onetime:${item.id}`, item.stars);
        return (
          <div key={item.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="text-xs text-muted">{item.description}</p>
              </div>
              <span className="rounded-full bg-pink-500/20 px-2.5 py-1 text-xs font-bold text-pink-500">
                {label(info)}
              </span>
            </div>
            {item.id === "reveal_who_liked_you" && revealActive && (
              <p className="mt-2 text-xs font-semibold text-pink-500">
                 Unlocked until{" "}
                {new Date(profile?.reveal_until ?? "").toTimeString().slice(0, 5)}
              </p>
            )}
            <button
              type="button"
              disabled={busy !== null || (item.id === "reveal_who_liked_you" && revealActive)}
              onClick={() =>
                void checkout({ kind: "onetime", item: item.id }, `onetime:${item.id}`, info)
              }
              className="mt-3 w-full rounded-xl bg-pink-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy === `onetime:${item.id}`
                ? "Opening…"
                : info.currency === "stars"
                ? `Buy — ${label(info)}`
                : `Pay — ${label(info)}`}
            </button>
          </div>
        );
      })}

      {message && <p className="text-center text-xs text-ink">{message}</p>}
      <p className="text-center text-[11px] text-muted">
        Star subscriptions are managed by Telegram: Settings → My Payments → cancel anytime.
      </p>
    </main>
  );
}