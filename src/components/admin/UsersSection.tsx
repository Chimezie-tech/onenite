"use client";
import { useCallback, useEffect, useState } from "react";
import { MoreVertical, Send } from "lucide-react";
import { getToken } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface Filters { q: string; city: string; gender: string; premium: string; status: string; }
const EMPTY: Filters = { q: "", city: "", gender: "", premium: "", status: "" };
const INPUT = "rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink";

export default function UsersSection() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Profile | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");
  const [bulkResult, setBulkResult] = useState("");
  const [suspendStart, setSuspendStart] = useState(""); 
  const [suspendEnd, setSuspendEnd] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filters.q) params.set("q", filters.q);
    if (filters.city) params.set("city", filters.city);
    if (filters.gender) params.set("gender", filters.gender);
    if (filters.premium) params.set("premium", filters.premium);
    if (filters.status) params.set("status", filters.status);
    const res = await fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { rows: Profile[]; total: number };
      setRows(data.rows);
      setTotal(data.total);
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function act(action: string, patch?: Record<string, unknown>) {
    if (!active) return;
    await fetch("/api/admin/users/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken() ?? ""}`,
      },
      body: JSON.stringify({ userId: active.id, action, patch }),
    });
    setActive(null);
    void load();
  }

  async function sendBulk() {
    setBulkResult("Sending…");
    const res = await fetch("/api/admin/bulk-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken() ?? ""}`,
      },
      body: JSON.stringify({ filters, message: bulkMsg }),
    });
    const data = (await res.json()) as { sent?: number; total?: number };
    setBulkResult(`Delivered to ${data.sent ?? 0}/${data.total ?? 0} users`);
  }

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input className={INPUT} placeholder="Search name / @username" value={filters.q}
          onChange={(e) => { setFilters({ ...filters, q: e.target.value }); setPage(1); }} />
        <input className={INPUT} placeholder="City" value={filters.city}
          onChange={(e) => { setFilters({ ...filters, city: e.target.value }); setPage(1); }} />
        <select className={INPUT} value={filters.gender}
          onChange={(e) => { setFilters({ ...filters, gender: e.target.value }); setPage(1); }}>
          <option value="">Any gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <select className={INPUT} value={filters.premium}
          onChange={(e) => { setFilters({ ...filters, premium: e.target.value }); setPage(1); }}>
          <option value="">Premium?</option>
          <option value="yes">Premium</option>
          <option value="no">Free</option>
        </select>
        <select className={INPUT} value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <button type="button" onClick={() => setBulkOpen(true)}
          className="ml-auto flex items-center gap-1 rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-bold text-white">
          <Send className="h-3 w-3" /> Bulk chat ({total})
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">City</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">Loading…</td></tr>
            ) : rows.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <img src={u.photo_url ?? "/fallback-avatar.png"} alt="" className="h-8 w-8 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-ink">{u.first_name}, {u.age}</p>
                      <p className="text-muted">@{u.username ?? u.telegram_id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-ink">{u.city}</td>
                <td className="p-3">
                  {u.is_premium
                    ? <span className="rounded-full bg-sky-500/15 px-2 py-0.5 font-semibold text-sky-500">Premium</span>
                    : <span className="text-muted">Free</span>}
                </td>
                <td className="p-3">
                  {u.is_banned
                    ? <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-semibold text-red-500">Banned</span>
                    : <span className="text-muted">Active</span>}
                </td>
                <td className="p-3 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <button type="button" aria-label="Actions" onClick={() => setActive(u)}
                    className="rounded-lg border border-line p-1.5 text-ink">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{total} users · page {page}/{pages}</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="rounded-lg border border-line px-3 py-1.5 text-ink disabled:opacity-40">Prev</button>
          <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}
            className="rounded-lg border border-line px-3 py-1.5 text-ink disabled:opacity-40">Next</button>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-4">
            <p className="font-bold text-ink">{active.first_name}, {active.age}</p>
            <p className="text-xs text-muted">@{active.username ?? active.telegram_id} · {active.city}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold">
              <button type="button" onClick={() => void act(active.is_banned ? "unsuspend" : "suspend")}
                className="rounded-lg bg-amber-500 py-2 text-white">
                {active.is_banned ? "Unsuspend" : "Suspend"}
              </button>
              <button type="button" onClick={() => void act("upgrade")}
                className="rounded-lg bg-sky-500 py-2 text-white">Upgrade +30d</button>
              <button type="button"
                onClick={() => { if (window.confirm(`Permanently delete ${active.first_name}?`)) void act("delete"); }}
                className="rounded-lg bg-red-500 py-2 text-white">Delete</button>
              <button type="button" onClick={() => setActive(null)}
                className="rounded-lg border border-line py-2 text-ink">Close</button>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <EditRow label="Name" initial={active.first_name} onSave={(v) => void act("edit", { first_name: v })} />
              <EditRow label="City" initial={active.city} onSave={(v) => void act("edit", { city: v })} />
              <EditRow label="Age" initial={String(active.age)} onSave={(v) => void act("edit", { age: Number(v) })} />
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-4">
            <p className="font-bold text-ink">Bulk chat to {total} filtered users</p>
            <textarea
              className="mt-3 h-24 w-full rounded-lg border border-line bg-field p-2 text-sm text-ink"
              value={bulkMsg}
              onChange={(e) => setBulkMsg(e.target.value)}
              placeholder="Message from the OneNite team…"
            />
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => void sendBulk()} disabled={!bulkMsg.trim()}
                className="flex-1 rounded-lg bg-pink-500 py-2 text-xs font-bold text-white disabled:opacity-40">
                Send via bot
              </button>
              <button type="button" onClick={() => { setBulkOpen(false); setBulkResult(""); }}
                className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink">Close</button>
            </div>
            {bulkResult && <p className="mt-2 text-xs text-muted">{bulkResult}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function EditRow({ label, initial, onSave }: { label: string; initial: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-muted">{label}</span>
      <input className="flex-1 rounded-lg border border-line bg-field px-2 py-1.5 text-xs text-ink"
        value={value} onChange={(e) => setValue(e.target.value)} />
      <button type="button" onClick={() => onSave(value)}
        className="rounded-lg border border-line px-2 py-1.5 text-xs font-semibold text-ink">Save</button>
    </div>
  );
}