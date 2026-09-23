"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Share2, Trash2, TrendingUp } from "lucide-react";
import { getToken } from "@/lib/supabase/client";
import AutoGrowTextarea from "@/components/ui/AutoGrowTextarea";
import ImageUploadField from "@/components/admin/ImageUploadField";
import Toast from "@/components/ui/Toast";

const FIELD = "w-full rounded-lg border border-line bg-field p-2 text-sm text-ink";

interface Currency { code: string; symbol: string; label: string; kind: string; }
interface Category { id: string; name: string; }
interface ProductRow {
  id: string; name: string; price: number; currency: string;
  category_id: string | null; units_sold: number;
  views: number; clicks: number; shares: number;
  thumbnail_url: string | null; image_url: string;
  images: string[]; description: string | null; location: string | null;
  shipping_available: boolean; colors: string[]; cta_url: string | null;
}
interface Analytics {
  products: ProductRow[];
  byCategory: Array<{ id: string; name: string; count: number }>;
  ads: unknown[];
}

const EMPTY_FORM = {
  name: "", price: "", currency: "ngn", category_id: "",
  thumb: null as string | null, images: [] as string[],
  description: "", location: "", colors: "", shipping: false, cta_url: "",
};

export default function ProductsSection() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [newCategory, setNewCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);

  const headers = { Authorization: `Bearer ${getToken() ?? ""}` };

  const load = useCallback(async () => {
    const [a, m] = await Promise.all([
      fetch("/api/admin/analytics", { headers }),
      fetch("/api/admin/meta"),
    ]);
    if (a.ok) setAnalytics((await a.json()) as Analytics);
    if (m.ok) {
      const meta = (await m.json()) as { currencies: Currency[]; categories: Category[] };
      setCurrencies(meta.currencies);
      setCategories(meta.categories);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function symbol(code: string): string {
    return currencies.find((c) => c.code === code)?.symbol ?? code;
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(p: ProductRow) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: String(p.price),
      currency: p.currency,
      category_id: p.category_id ?? "",
      thumb: p.thumbnail_url,
      images: p.images ?? [],
      description: p.description ?? "",
      location: p.location ?? "",
      colors: (p.colors ?? []).join(", "),
      shipping: p.shipping_available,
      cta_url: p.cta_url ?? "",
    });
    setModalOpen(true);
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    await fetch("/api/admin/meta", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", name: newCategory.trim() }),
    });
    setNewCategory("");
    void load();
  }

  async function save() {
    setBusy(true);
    const payload = {
      name: form.name,
      price: Number(form.price),
      currency: form.currency,
      category_id: form.category_id || null,
      image_url: form.thumb ?? form.images[0] ?? "",
      thumbnail_url: form.thumb,
      images: form.images,
      description: form.description || null,
      location: form.location || null,
      shipping_available: form.shipping,
      colors: form.colors.split(",").map((c) => c.trim()).filter(Boolean),
      cta_url: form.cta_url || null,
    };
    const res = await fetch("/api/admin/products", {
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
    setToast({ message: editingId ? "Product updated ✅" : "Product created ✅", kind: "success" });
    void load();
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete "${name}" permanently?`)) return;
    const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE", headers });
    setToast(
      res.ok
        ? { message: "Product deleted", kind: "success" }
        : { message: "Delete failed", kind: "error" }
    );
    void load();
  }

  async function addSold(id: string) {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id, units_sold_increment: true }),
    });
    void load();
  }

  const rows = analytics?.products ?? [];
  const mostViewed = [...rows].sort((a, b) => b.views - a.views)[0];
  const mostClicked = [...rows].sort((a, b) => b.clicks - a.clicks)[0];
  const mostSold = [...rows].sort((a, b) => b.units_sold - a.units_sold)[0];

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast message={toast.message} kind={toast.kind} onDone={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink">Products ({rows.length})</h2>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-1 rounded-lg bg-pink-500 px-3 py-2 text-xs font-bold text-white">
          <Plus className="h-3 w-3" /> Create Product
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-muted">Most viewed</p>
          <p className="truncate text-sm font-bold text-ink">{mostViewed?.name ?? "—"}</p>
          <p className="text-xs text-pink-500">{mostViewed?.views ?? 0} views</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-muted">Most clicked</p>
          <p className="truncate text-sm font-bold text-ink">{mostClicked?.name ?? "—"}</p>
          <p className="text-xs text-pink-500">{mostClicked?.clicks ?? 0} clicks</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-muted">Most sold</p>
          <p className="truncate text-sm font-bold text-ink">{mostSold?.name ?? "—"}</p>
          <p className="text-xs text-pink-500">{mostSold?.units_sold ?? 0} sold</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-muted">By category</p>
          {(analytics?.byCategory ?? []).slice(0, 3).map((c) => (
            <p key={c.id} className="truncate text-xs text-ink">{c.name}: {c.count}</p>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Views</th>
              <th className="p-3">Clicks</th>
              <th className="p-3">Sold</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted">No products yet</td></tr>
            ) : rows.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <img src={p.thumbnail_url ?? p.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                    <span className="font-semibold text-ink">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 text-muted">
                  {categories.find((c) => c.id === p.category_id)?.name ?? "—"}
                </td>
                <td className="p-3 font-semibold text-pink-500">
                  {symbol(p.currency)}{Number(p.price).toLocaleString()}
                </td>
                <td className="p-3 text-ink">{p.views}</td>
                <td className="p-3 text-ink">{p.clicks}</td>
                <td className="p-3 text-ink">{p.units_sold}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button type="button" aria-label="Edit" onClick={() => openEdit(p)}
                      className="rounded border border-line p-1 text-ink"><Pencil className="h-3 w-3" /></button>
                    <button type="button" aria-label="Add sale" onClick={() => void addSold(p.id)}
                      className="rounded border border-line p-1 text-emerald-500"><TrendingUp className="h-3 w-3" /></button>
                    <button type="button" aria-label="Delete" onClick={() => void remove(p.id, p.name)}
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
            <p className="mb-3 font-bold text-ink">{editingId ? "Edit Product" : "Create Product"}</p>
            <div className="flex flex-col gap-2">
              <input className={FIELD} placeholder="Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={FIELD} placeholder="Price" type="number" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <select className={FIELD} value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <select className={FIELD} value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input className={FIELD} placeholder="+ New category" value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)} />
                <button type="button" onClick={() => void addCategory()}
                  className="shrink-0 rounded-lg border border-line px-2 text-xs font-bold text-ink">Add</button>
              </div>
              <ImageUploadField label="thumbnail" value={form.thumb}
                onChange={(url) => setForm({ ...form, thumb: url })} />
              <div className="rounded-lg border border-line p-2">
                <p className="text-xs text-muted">Gallery ({form.images.length}/6)</p>
                {form.images.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <img src={url} alt="" className="h-8 w-8 rounded object-cover" />
                    <button type="button" className="text-xs text-red-400"
                      onClick={() => setForm({ ...form, images: form.images.filter((_, x) => x !== i) })}>
                      Remove
                    </button>
                  </div>
                ))}
                {form.images.length < 6 && (
                  <ImageUploadField label={`image ${form.images.length + 1}`} value={null}
                    onChange={(url) => setForm({ ...form, images: [...form.images, url] })} />
                )}
              </div>
              <AutoGrowTextarea value={form.description} placeholder="Description…"
                className={FIELD}
                onChange={(v) => setForm({ ...form, description: v })} />
              <input className={FIELD} placeholder="Location" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <input className={FIELD} placeholder="Colors hex (#e11d48, #0ea5e9)" value={form.colors}
                onChange={(e) => setForm({ ...form, colors: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.shipping}
                  onChange={(e) => setForm({ ...form, shipping: e.target.checked })} />
                Shipping available
              </label>
              <input className={FIELD} placeholder="Checkout URL (optional)" value={form.cta_url}
                onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={busy || !form.name || !form.price} onClick={() => void save()}
                className="flex-1 rounded-lg bg-pink-500 py-2 text-sm font-bold text-white disabled:opacity-50">
                {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : editingId ? "Save changes" : "Create product"}
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