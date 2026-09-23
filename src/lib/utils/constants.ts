import type { PlanId } from "@/types";

export const APP_NAME = "OneNite";
export const APP_TAGLINE = "Meet amazing people near you 🌍❤️";

// --- Free tier limits ---
export const FREE_DAILY_LIKES = 20;
export const FREE_DAILY_SUPER_LIKES = 5;
export const FREE_DAILY_MESSAGES = 5;

// --- Premium tier limits ---
export const PREMIUM_DAILY_SUPER_LIKES = 10;

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

// --- Onboarding v2: categorized profile attributes ---
export interface ProfileCategory {
  key:
    | "orientation" | "relationship_status" | "drinking" | "smoking"
    | "nightlife" | "politics" | "religion" | "education" | "kids";
  label: string;
  emoji: string;
  options: readonly string[];
}

export const PROFILE_CATEGORIES: ProfileCategory[] = [
  { key: "orientation", label: "Orientation", emoji: "🏳️🌈", options: ["Straight", "Bisexual", "Homosexual", "Pansexual", "Asexual"] },
  { key: "relationship_status", label: "Relationship", emoji: "💍", options: ["Single", "Divorced", "Widowed", "Separated", "Open relationship"] },
  { key: "drinking", label: "Drinking", emoji: "🍷", options: ["Never", "Socially", "Often", "Daily"] },
  { key: "smoking", label: "Smoking", emoji: "🚬", options: ["Never", "Socially", "Often", "Daily"] },
  { key: "nightlife", label: "Nightlife", emoji: "🌙", options: ["Homebody", "Occasionally", "Every weekend", "Night owl"] },
  { key: "politics", label: "Politics", emoji: "🗳️", options: ["Liberal", "Moderate", "Conservative", "Apolitical"] },
  { key: "religion", label: "Faith", emoji: "🙏", options: ["Christian", "Muslim", "Traditional", "Spiritual", "Atheist", "Other"] },
  { key: "education", label: "Education", emoji: "🎓", options: ["High school", "Vocational", "Bachelor's", "Master's", "Doctorate", "Other"] },
  { key: "kids", label: "Kids", emoji: "👶", options: ["No kids yet", "Want kids", "Have kids", "Don't want kids"] },
];

export const INTEREST_GROUPS: { group: string; emoji: string; tags: readonly string[] }[] = [
  { group: "Music", emoji: "🎵", tags: ["Afrobeats", "Amapiano", "Gospel", "Hip-Hop", "R&B", "House", "Live bands"] },
  { group: "Sports", emoji: "⚽", tags: ["Football", "Basketball", "Tennis", "Swimming", "Gym", "Running", "Cycling"] },
  { group: "Food", emoji: "🍲", tags: ["Cooking", "Foodie", "Baking", "Grill master", "Street food", "Vegan"] },
  { group: "Arts & Culture", emoji: "🎭", tags: ["Movies", "Comedy", "Theatre", "Poetry", "Fashion", "Photography", "Dancing"] },
  { group: "Lifestyle", emoji: "🌿", tags: ["Travel", "Reading", "Gaming", "Camping", "Beach", "Volunteering"] },
  { group: "Hustle", emoji: "💼", tags: ["Business", "Tech", "Crypto", "Content creation", "Investing", "Side hustles"] },
];