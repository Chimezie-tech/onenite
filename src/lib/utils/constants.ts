import type { PlanId } from "@/types";

export const APP_NAME = "OneNite";
export const APP_TAGLINE = "Meet amazing people near you 🌍❤️";

// --- Free tier limits ---
export const FREE_DAILY_LIKES = 10;
export const FREE_DAILY_SUPER_LIKES = 1;
export const FREE_DAILY_MESSAGES = 10;

// --- Premium tier limits ---
export const PREMIUM_DAILY_SUPER_LIKES = 5;

// --- Profile rules ---
export const MIN_PHOTOS = 1;
export const MAX_PHOTOS = 6;
export const BIO_MAX_LENGTH = 500;
export const MIN_AGE = 18;
export const MAX_AGE = 99;

// --- Messaging rules ---
export const MESSAGE_MAX_LENGTH = 1000;

// --- Safety ---
export const AUTO_SUSPEND_REPORT_COUNT = 5;

export const DECK_BATCH = 20;

// --- Uploads ---
export const MAX_UPLOAD_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// --- Premium pricing (Telegram Stars) ---
export const PLANS: Record<"weekly" | "monthly", { stars: number; days: number }> = {
  weekly:  { stars: 50,  days: 7 },
  monthly: { stars: 150, days: 30 },
};

// --- Ads ---
export const AD_ROTATION_MS = 6000;
export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦", GHS: "₵", KES: "KSh", USD: "$",
};

// --- Curated interest tags (African market) ---
export const INTEREST_TAGS = [
  "Afrobeats", "Amapiano", "Football", "Cooking", "Travel", "Fashion",
  "Gospel", "Movies", "Fitness", "Tech", "Reading", "Comedy",
  "Foodie", "Music", "Dancing", "Business", "Gaming", "Photography",
] as const;