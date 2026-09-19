/**
 * Safe wrappers around the Telegram Mini App SDK.
 * Returns null when running outside Telegram (e.g. local browser testing).
 */

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function getInitData(): string {
  return getTelegramWebApp()?.initData ?? "";
}

export function getTelegramUser(): TelegramWebAppUser | null {
  return getTelegramWebApp()?.initDataUnsafe?.user ?? null;
}

export function expandApp(): void {
  const tg = getTelegramWebApp();
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.setHeaderColor("#000000");
  tg.setBackgroundColor("#000000");
}

/** Tiny helper for tactile feedback on swipes/matches (used in Phase 6+) */
export function haptic(
  style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light"
): void {
  getTelegramWebApp()?.HapticFeedback.impactOccurred(style);
}