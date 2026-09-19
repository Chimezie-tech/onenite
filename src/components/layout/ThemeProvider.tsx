"use client";
import { useEffect } from "react";
import { useThemeStore, type ThemePreference } from "@/store/useThemeStore";
import { getTelegramWebApp } from "@/lib/telegram/sdk";

export function resolveIsDark(preference: ThemePreference): boolean {
  if (preference !== "system") return preference === "dark";
  const tg = getTelegramWebApp();
  if (tg) return tg.colorScheme === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(isDark: boolean): void {
  document.documentElement.classList.toggle("dark", isDark);
  getTelegramWebApp()?.setHeaderColor(isDark ? "#000000" : "#ffffff");
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    const refresh = () => applyTheme(resolveIsDark(useThemeStore.getState().preference));
    refresh();

    const tg = getTelegramWebApp();
    tg?.onEvent("themeChanged", refresh);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", refresh);
    return () => {
      tg?.offEvent("themeChanged", refresh);
      mq.removeEventListener("change", refresh);
    };
  }, [preference]);

  return <>{children}</>;
}