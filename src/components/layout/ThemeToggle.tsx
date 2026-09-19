"use client";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useThemeStore, type ThemePreference } from "@/store/useThemeStore";

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const ICONS: Record<ThemePreference, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

export default function ThemeToggle() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const Icon = ICONS[preference];

  return (
    <button
      type="button"
      aria-label={`Theme: ${preference}. Tap to change.`}
      onClick={() => setPreference(NEXT[preference])}
      className="fixed top-3 right-3 z-50 rounded-full border border-line bg-surface p-2 text-ink"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}