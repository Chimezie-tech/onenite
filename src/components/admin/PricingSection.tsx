"use client";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/supabase/client";

interface Row {
  key: string;
  label: string;
  stars: number;
  currency: string;
  payment_link: string | null;
}
interface Draft {
  stars: string;
  currency: string;
  payment_link: string;
}

export default function PricingSection() {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Record<string, Draft>>({});

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/pricing");
      if (!res.ok) return;
      const data = (await res.json()) as Row[];
      setRows(data);
      const d: Record<string, Draft> = {};
      for (const r of data) {
        d[r.key] = {
          stars: String(r.stars),
          currency: r.currency,
          payment_link: r.payment_link ?? "",
        };
      }
      setDraft(d);
    })();
  }, []);

  async function save(key: string) {
    const d = draft[key];
    await fetch("/api/admin/pricing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken() ?? ""}`,
      },
      body: JSON.stringify({
        key,
        stars: Number(d.stars),
        currency: d.currency,
        payment_link: d.payment_link || null,
      }),
    });
    alert("Price updated ✅ — live everywhere, no redeploy needed.");
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.key} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-40 flex-1 text-sm font-semibold text-ink">{r.label}</p>
            <select
              className="rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
              value={draft[r.key]?.currency ?? "stars"}
              onChange={(e) =>
                setDraft({ ...draft, [r.key]: { ...draft[r.key], currency: e.target.value } })
              }
            >
              <option value="stars">Stars ⭐</option>
              <option value="ngn">NGN ₦</option>
              <option value="ghs">GHS ₵</option>
              <option value="kes">KES</option>
              <option value="usd">USD $</option>
            </select>
            <input
              type="number"
              className="w-24 rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
              value={draft[r.key]?.stars ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, [r.key]: { ...draft[r.key], stars: e.target.value } })
              }
            />
            <button
              type="button"
              onClick={() => void save(r.key)}
              className="rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-bold text-white"
            >
              Save
            </button>
          </div>
          {draft[r.key]?.currency !== "stars" && (
            <input
              className="w-full rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
              placeholder="Payment link (PayPal / Flutterwave checkout URL)"
              value={draft[r.key]?.payment_link ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, [r.key]: { ...draft[r.key], payment_link: e.target.value } })
              }
            />
          )}
        </div>
      ))}
      <p className="text-xs text-muted">
        Stars = native Telegram checkout. Fiat = the pay button opens your PayPal/Flutterwave link.
      </p>
    </div>
  );
}