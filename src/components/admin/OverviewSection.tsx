"use client";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/supabase/client";

export default function OverviewSection() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      });
      if (res.ok) setStats((await res.json()) as Record<string, number>);
    })();
  }, []);

  if (!stats) return <p className="text-sm text-muted">Loading…</p>;

  const cards: Array<[string, number]> = [
    ["Total users", stats.users],
    ["Banned", stats.banned],
    ["Premium", stats.premium],
    ["Matches", stats.matches],
    ["Likes sent", stats.likes],
    ["Messages", stats.messages],
    ["Reports", stats.reports],
    ["Stars earned", stats.stars],
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
        </div>
      ))}
    </div>
  );
}