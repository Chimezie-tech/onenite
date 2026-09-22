"use client";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getToken } from "@/lib/supabase/client";

interface Series {
  days: string[];
  newUsers: number[];
  likes: number[];
  messages: number[];
  revenue: number[];
}

interface Stats {
  users: number;
  banned: number;
  premium: number;
  matches: number;
  likes: number;
  messages: number;
  reports: number;
  stars: number;
  series?: Series;
}

export default function OverviewSection() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      });
      if (res.ok) setStats((await res.json()) as Stats);
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

  const s = stats.series;
  const lineData =
    s?.days.map((d, i) => ({ day: d.slice(5), users: s.newUsers[i] })) ?? [];
  const barData =
    s?.days.map((d, i) => ({
      day: d.slice(5),
      likes: s.likes[i],
      messages: s.messages[i],
    })) ?? [];
  const revData =
    s?.days.map((d, i) => ({ day: d.slice(5), stars: s.revenue[i] })) ?? [];
  const pieData = [
    { name: "Premium", value: stats.premium },
    { name: "Free", value: Math.max(0, stats.users - stats.premium) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-line bg-surface p-4"
          >
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="mb-2 text-xs font-bold text-ink">New users (14 days)</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8884" />
              <XAxis dataKey="day" fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#ec4899"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="mb-2 text-xs font-bold text-ink">
            Activity (likes vs messages)
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8884" />
              <XAxis dataKey="day" fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="likes" fill="#ec4899" radius={3} />
              <Bar dataKey="messages" fill="#8b5cf6" radius={3} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="mb-2 text-xs font-bold text-ink">Free vs Premium</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
              >
                {pieData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={i === 0 ? "#0ea5e9" : "#e5e7eb"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="mb-2 text-xs font-bold text-ink">
            Stars revenue (14 days)
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8884" />
              <XAxis dataKey="day" fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="stars" fill="#f59e0b" radius={3} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}