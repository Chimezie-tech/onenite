"use client";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/supabase/client";

interface Row { key: string; label: string; stars: number; currency: string; }

export default function PricingSection() {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Record<string, { stars: string; currency: string }>>({});

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/pricing");
      if (!res.ok) return;
      const data = (await res.json()) as Row[];
      setRows(data);
      const d: Record<string, { stars: string; currency: string }> = {};
      for (const r of data) d[r.key] = { stars: String(r.stars), currency: r.currency };
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
      body: JSON.stringify({ key, stars: Number(d.stars), currency: d.currency }),
    });
    alert("Price updated ✅ — live everywhere, no redeploy needed.");
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3">
          <p className="min-w-40 flex-1 text-sm font-semibold text-ink">{r.label}</p>
          <select
            className="rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
            value={draft[r.key]?.currency ?? "stars"}
            onChange={(e) => setDraft({ ...draft, [r.key]: { ...draft[r.key], currency: e.target.value } })}
          >
            <option value="stars">Stars ⭐</option>
            <option value="ngn">NGN ₦ (soon)</option>
            <option value="ghs">GHS ₵ (soon)</option>
            <option value="kes">KES (soon)</option>
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
      ))}
      <p className="text-xs text-muted">
        Changes apply instantly to the Premium page and checkout invoices — no code deploy needed.
      </p>
    </div>
  );
}