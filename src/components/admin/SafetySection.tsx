"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { getToken } from "@/lib/supabase/client";
import Toast from "@/components/ui/Toast";

interface Ticket { id: string; topic: string; message: string; user?: { first_name: string; username: string }; created_at: string; }
interface Report { id: string; reason: string; message: string; reporter?: { first_name: string }; reported?: { first_name: string; id: string }; created_at: string; }

export default function SafetySection() {
  const [tab, setTab] = useState<"tickets" | "reports">("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);

  const headers = { Authorization: `Bearer ${getToken() ?? ""}` };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/safety", { headers });
    if (res.ok) {
      const data = (await res.json()) as { tickets: Ticket[]; reports: Report[] };
      setTickets(data.tickets);
      setReports(data.reports);
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function resolve(type: "ticket" | "report", id: string) {
    await fetch("/api/admin/safety", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ action: type === "ticket" ? "resolve_ticket" : "resolve_report", id }),
    });
    setToast({ message: "Resolved ✅", kind: "success" });
    void load();
  }

  async function suspendUser(userId: string) {
    if (!window.confirm("Suspend this user?")) return;
    await fetch("/api/admin/users/action", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "suspend", patch: { end: null } }), // Permanent ban
    });
    setToast({ message: "User suspended", kind: "success" });
    void load();
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast.message} kind={toast.kind} onDone={() => setToast(null)} />}

      <div className="flex gap-2 border-b border-line pb-2">
        <button onClick={() => setTab("tickets")} className={`px-4 py-2 text-sm font-bold ${tab === "tickets" ? "border-b-2 border-pink-500 text-pink-500" : "text-muted"}`}>
          Support Tickets ({tickets.length})
        </button>
        <button onClick={() => setTab("reports")} className={`px-4 py-2 text-sm font-bold ${tab === "reports" ? "border-b-2 border-pink-500 text-pink-500" : "text-muted"}`}>
          User Reports ({reports.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-pink-500" /></div>
      ) : tab === "tickets" ? (
        <div className="flex flex-col gap-3">
          {tickets.length === 0 && <p className="text-center text-sm text-muted">No open tickets. Inbox zero! 🎉</p>}
          {tickets.map((t) => (
            <div key={t.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-ink">{t.topic}</p>
                <span className="text-xs text-muted">{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-xs text-muted">From: {t.user?.first_name} (@{t.user?.username})</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{t.message}</p>
              <button onClick={() => void resolve("ticket", t.id)} className="mt-3 flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">
                <Check className="h-3 w-3" /> Mark Resolved
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.length === 0 && <p className="text-center text-sm text-muted">No open reports.</p>}
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-red-500">🚨 {r.reason}</p>
                <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Reporter: {r.reporter?.first_name} → Reported: <span className="font-bold text-ink">{r.reported?.first_name ?? "Unknown"}</span>
              </p>
              {r.message && <p className="mt-2 text-sm text-ink">&quot;{r.message}&quot;</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => void resolve("report", r.id)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">
                  Dismiss
                </button>
                {r.reported?.id && (
                  <button onClick={() => void suspendUser(r.reported!.id)} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white">
                    Suspend User
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}