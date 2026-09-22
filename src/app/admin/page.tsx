"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Menu, Megaphone, Users } from "lucide-react";
import OverviewSection from "@/components/admin/OverviewSection";
import UsersSection from "@/components/admin/UsersSection";
import AdsSection from "@/components/admin/AdsSection";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "ads", label: "Ads & Products", icon: Megaphone },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default function AdminPage() {
  const [section, setSection] = useState<SectionId>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nav = (
    <div className="flex flex-col gap-1">
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => { setSection(id); setDrawerOpen(false); }}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
            section === id ? "bg-pink-500 text-white" : "text-ink hover:bg-field"
          }`}
        >
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
      <Link
        href="/"
        className="mt-4 flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to app (user mode)
      </Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-app">
      <header className="flex items-center gap-3 border-b border-line bg-surface p-3 md:hidden">
        <button type="button" aria-label="Open menu" onClick={() => setDrawerOpen(true)} className="text-ink">
          <Menu className="h-5 w-5" />
        </button>
        <p className="font-bold text-ink">Admin Console</p>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside className="hidden w-56 shrink-0 border-r border-line bg-surface p-3 md:block">
          <p className="mb-3 px-3 font-bold text-ink">Admin Console</p>
          {nav}
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/60"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-surface p-3">
              <p className="mb-3 px-3 font-bold text-ink">Admin Console</p>
              {nav}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1 p-4">
          {section === "overview" && <OverviewSection />}
          {section === "users" && <UsersSection />}
          {section === "ads" && <AdsSection />}
        </div>
      </div>
    </main>
  );
}