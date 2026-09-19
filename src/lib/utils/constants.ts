import type { PlanId } from "@/types";

export const APP_NAME = "OneNite";
export const APP_TAGLINE = "Meet amazing people near you 🌍❤️";

// --- Free tier limits ---
export const FREE_DAILY_LIKES = 15;
export const FREE_WEEKLY_SUPER_LIKES = 1;
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

// --- Premium pricing (Telegram Stars) ---
export const PLANS: Record<PlanId, { stars: number; days: number }> = {
  weekly:  { stars: 50,   days: 7 },
  monthly: { stars: 150,  days: 30 },
  yearly:  { stars: 1200, days: 365 },
};

// --- Curated interest tags (African market) ---
export const INTEREST_TAGS = [
  "Afrobeats", "Amapiano", "Football", "Cooking", "Travel", "Fashion",
  "Gospel", "Movies", "Fitness", "Tech", "Reading", "Comedy",
  "Foodie", "Music", "Dancing", "Business", "Gaming", "Photography",
] as const;