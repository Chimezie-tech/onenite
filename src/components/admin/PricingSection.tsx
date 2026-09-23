"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getToken } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";

interface Row { key: string; label: string; stars: number; currency: string; payment_link: string | null; }
interface Currency { code: string; symbol: string; label: string; kind: string; }
interface Draft { stars: string; currency: string; payment_link: string; }

export default function PricingSection() {
  const [rows, setRows] = useState<Row[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [newCur, setNewCur] = useState({ code: "", symbol: "", label: "", kind: "fiat" });
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);

  const headers = { Authorization: `Bearer ${getToken() ?? ""}` };

  async function load() {
    const [p, m] = await Promise.all([fetch("/api/pricing"), fetch("/api/admin/meta")]);
    if (p.ok) {
      const data = (await p.json()) as Row[];
      setRows(data);
      const d: Record<string, Draft> = {};
      for (const r of data) {
        d[r.key] = { stars: String(r.stars), currency: r.currency, payment_link: r.payment_link ?? "" };
      }
      setDraft(d);
    }
    if (m.ok) {
      const meta = (await m.json()) as { currencies: Currency[] };
      setCurrencies(meta.currencies);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function save(key: string) {
    const d = draft[key];
    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        stars: Number(d.stars),
        currency: d.currency,
        payment_link: d.payment_link || null,
      }),
    });
    setToast(
      res.ok
        ? { message: "Price updated ✅ live everywhere", kind: "success" }
        : { message: "Update failed", kind: "error" }
    );
  }

  async function addCurrency() {
    if (!newCur.code || !newCur.symbol || !newCur.label) return;
    const res = await fetch("/api/admin/meta", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "currency", ...newCur }),
    });
    if (res.ok) {
      setNewCur({ code: "", symbol: "", label: "", kind: "fiat" });
      setToast({ message: "Currency added ✅", kind: "success" });
      void load();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {toast && <Toast message={toast.message} kind={toast.kind} onDone={() => setToast(null)} />}

      <h2 className="font-bold text-ink">Pricing & Billing</h2>

      {rows.map((r) => (
        <div key={r.key} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-40 flex-1 text-sm font-semibold text-ink">{r.label}</p>
            <select
              className="rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
              value={draft[r.key]?.currency ?? "stars"}
              onChange={(e) => setDraft({ ...draft, [r.key]: { ...draft[r.key], currency: e.target.value } })}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.label}</option>
              ))}
            </select>
            <input
              type="number"
              className="w-24 rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
              value={draft[r.key]?.stars ?? ""}
              onChange={(e) => setDraft({ ...draft, [r.key]: { ...draft[r.key], stars: e.target.value } })}
            />
            <button type="button" onClick={() => void save(r.key)}
              className="rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-bold text-white">Save</button>
          </div>
          {draft[r.key]?.currency !== "stars" && (
            <input
              className="w-full rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
              placeholder="Payment link (PayPal / Flutterwave checkout URL)"
              value={draft[r.key]?.payment_link ?? ""}
              onChange={(e) => setDraft({ ...draft, [r.key]: { ...draft[r.key], payment_link: e.target.value } })}
            />
          )}
        </div>
      ))}

      <div className="rounded-xl border border-line bg-surface p-3">
        <p className="mb-2 text-sm font-semibold text-ink">Add a currency</p>
        <div className="flex flex-wrap gap-2">
          <input className="w-20 rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
            placeholder="code (eur)" value={newCur.code}
            onChange={(e) => setNewCur({ ...newCur, code: e.target.value })} />
          <input className="w-16 rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
            placeholder="symbol (€)" value={newCur.symbol}
            onChange={(e) => setNewCur({ ...newCur, symbol: e.target.value })} />
          <input className="flex-1 rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
            placeholder="label (Euro)" value={newCur.label}
            onChange={(e) => setNewCur({ ...newCur, label: e.target.value })} />
          <select className="rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
            value={newCur.kind}
            onChange={(e) => setNewCur({ ...newCur, kind: e.target.value })}>
            <option value="fiat">Fiat</option>
            <option value="crypto">Crypto</option>
            <option value="stars">Stars</option>
          </select>
          <button type="button" onClick={() => void addCurrency()}
            className="flex items-center gap-1 rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-bold text-white">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}