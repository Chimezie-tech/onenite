"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { getToken } from "@/lib/supabase/client";
import ImageUploadField from "@/components/admin/ImageUploadField";
import Toast from "@/components/ui/Toast";
import type { AdPlacement } from "@/types";

const FIELD = "w-full rounded-lg border border-line bg-field p-2 text-sm text-ink";

interface AdRow {
  id: string; title: string; subtitle: string; image_url: string;
  cta_label: string; cta_type: "internal" | "external"; cta_url: string;
  placements: AdPlacement[]; impressions: number; clicks: number;
}

const EMPTY_FORM = {
  title: "", subtitle: "", image: null as string | null,
  cta_label: "", cta_type: "external" as "internal" | "external",
  cta_url: "", placements: ["home"] as AdPlacement[],
};

export default function AdsSection() {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);

  const headers = { Authorization: `Bearer ${getToken() ?? ""}` };

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/analytics", { headers });
    if (!res.ok) return;
    const data = (await res.json()) as { ads: AdRow[] };
    // analytics returns light rows; fetch full ads for editing
    const full = await fetch("/api/admin/ads-full", { headers }).catch(() => null);
    if (full && full.ok) {
      const fd = (await full.json()) as { ads: AdRow[] };
      setAds(fd.ads);
    } else {
      setAds(data.ads);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function togglePlacement(p: AdPlacement) {
    setForm((f) => ({
      ...f,
      placements: f.placements.includes(p)
        ? f.placements.filter((x) => x !== p)
        : [...f.placements, p],
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(a: AdRow) {
    setEditingId(a.id);
    setForm({
      title: a.title, subtitle: a.subtitle ?? "", image: a.image_url,
      cta_label: a.cta_label, cta_type: a.cta_type, cta_url: a.cta_url,
      placements: a.placements,
    });
    setModalOpen(true);
  }

  async function save() {
    setBusy(true);
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      image_url: form.image ?? "",
      cta_label: form.cta_label || "Learn More",
      cta_type: form.cta_type,
      cta_url: form.cta_url,
      placements: form.placements,
    };
    const res = await fetch("/api/admin/ads", {
      method: editingId ? "PATCH" : "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });
    setBusy(false);
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      setToast({ message: err.error ?? "Failed to save", kind: "error" });
      return;
    }
    setModalOpen(false);
    setToast({ message: editingId ? "Ad updated ✅" : "Ad created ✅", kind: "success" });
    void load();
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete ad "${title}"?`)) return;
    const res = await fetch(`/api/admin/ads?id=${id}`, { method: "DELETE", headers });
    setToast(res.ok ? { message: "Ad deleted", kind: "success" } : { message: "Delete failed", kind: "error" });
    void load();
  }

  const totalImpressions = ads.reduce((s, a) => s + (a.impressions ?? 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks ?? 0), 0);
  const best = [...ads].sort((a, b) => {
    const ctrA = a.impressions ? a.clicks / a.impressions : 0;
    const ctrB = b.impressions ? b.clicks / b.impressions : 0;
    return ctrB - ctrA;
  })[0];

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast.message} kind={toast.kind} onDone={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink">Ads ({ads.length})</h2>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-1 rounded-lg bg-pink-500 px-3 py-2 text-xs font-bold text-white">
          <Plus className="h-3 w-3" /> Create Ad
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-muted">Impressions</p>
          <p className="text-xl font-bold text-ink">{totalImpressions}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-muted">Clicks</p>
          <p className="text-xl font-bold text-ink">{totalClicks}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-muted">Best CTR</p>
          <p className="truncate text-sm font-bold text-ink">{best?.title ?? "—"}</p>
          <p className="text-xs text-pink-500">
            {best && best.impressions ? Math.round((best.clicks / best.impressions) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="p-3">Ad</th>
              <th className="p-3">CTA button</th>
              <th className="p-3">Placements</th>
              <th className="p-3">Impr.</th>
              <th className="p-3">Clicks</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No ads yet</td></tr>
            ) : ads.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <img src={a.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                    <span className="font-semibold text-ink">{a.title}</span>
                  </div>
                </td>
                <td className="p-3 text-pink-500">{a.cta_label}</td>
                <td className="p-3 text-muted">{(a.placements ?? []).join(", ")}</td>
                <td className="p-3 text-ink">{a.impressions ?? 0}</td>
                <td className="p-3 text-ink">{a.clicks ?? 0}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button type="button" aria-label="Edit" onClick={() => openEdit(a)}
                      className="rounded border border-line p-1 text-ink"><Pencil className="h-3 w-3" /></button>
                    <button type="button" aria-label="Delete" onClick={() => void remove(a.id, a.title)}
                      className="rounded border border-line p-1 text-red-400"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-4">
            <p className="mb-3 font-bold text-ink">{editingId ? "Edit Ad" : "Create Ad"}</p>
            <div className="flex flex-col gap-2">
              <input className={FIELD} placeholder="Title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className={FIELD} placeholder="Subtitle (optional)" value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              <ImageUploadField label="ad image" value={form.image}
                onChange={(url) => setForm({ ...form, image: url })} />
              <input className={FIELD} placeholder="CTA button text (any text, e.g. Join Free)"
                value={form.cta_label}
                onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
              <select className={FIELD} value={form.cta_type}
                onChange={(e) => setForm({ ...form, cta_type: e.target.value === "internal" ? "internal" : "external" })}>
                <option value="external">External URL</option>
                <option value="internal">Internal page (e.g. /premium)</option>
              </select>
              <input className={FIELD} placeholder="CTA destination (URL or /path)" value={form.cta_url}
                onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
              <div className="flex gap-3 text-sm text-ink">
                {(["home", "chat", "profile"] as AdPlacement[]).map((p) => (
                  <label key={p} className="flex items-center gap-1">
                    <input type="checkbox" checked={form.placements.includes(p)} onChange={() => togglePlacement(p)} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={busy || !form.title || !form.image || !form.cta_url}
                onClick={() => void save()}
                className="flex-1 rounded-lg bg-pink-500 py-2 text-sm font-bold text-white disabled:opacity-50">
                {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : editingId ? "Save changes" : "Create ad"}
              </button>
              <button type="button" onClick={() => setModalOpen(false)}
                className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}