/**
 * Ambient type declarations for the Telegram Mini App SDK
 * (script loaded from https://telegram.org/js/telegram-web-app.js).
 * No `any` anywhere — every field we touch is explicitly typed.
 * This file has no imports/exports on purpose: that makes it a
 * global script, so these types are visible everywhere.
 */



interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  allows_write_to_pm?: boolean;
}

interface TelegramInitDataUnsafe {
  user?: TelegramWebAppUser;
  auth_date?: number;
  hash?: string;
  query_id?: string;
}

interface TelegramHapticFeedback {
  impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
  notificationOccurred(type: "error" | "success" | "warning"): void;
  selectionChanged(): void;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramInitDataUnsafe;
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  isExpanded: boolean;
  isEnabled: boolean;
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  enableClosing(): void;
  disableClosing(): void;
  openLink(url: string): void;
  openTelegramLink(url: string): void;
    onEvent(eventType: "themeChanged" | "viewportChanged" | "backButtonClicked", eventHandler: () => void): void;
  offEvent(eventType: "themeChanged" | "viewportChanged" | "backButtonClicked", eventHandler: () => void): void;
  HapticFeedback: TelegramHapticFeedback;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}