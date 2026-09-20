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
  weekly:  { stars: 85,  days: 7 },
  monthly: { stars: 250, days: 30 },
};

// --- One-time micro-purchases (Stars) ---
export const ONE_TIME_ITEMS = {
  super_likes_5: {
    id: "super_likes_5" as const,
    label: "5 Super Likes",
    description: "Stand out — super likes are 3× more likely to match.",
    stars: 30,
  },
  reveal_who_liked_you: {
    id: "reveal_who_liked_you" as const,
    label: "Reveal who liked you",
    description: "See everyone who already liked you, instantly.",
    stars: 60,
  },
} as const;

export type OneTimeItemId = keyof typeof ONE_TIME_ITEMS;

// --- Boosts (time-limited visibility multiplier) ---
export const BOOST_DURATIONS_MINUTES = {
  "30min": 30,
} as const;

export const BOOSTS = {
  boost_30min: {
    id: "boost_30min" as const,
    label: "30-minute Profile Boost",
    description: "Your profile appears first in the deck for 30 minutes.",
    stars: 40,
    duration_minutes: BOOST_DURATIONS_MINUTES["30min"],
  },
} as const;

export type BoostId = keyof typeof BOOSTS;

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