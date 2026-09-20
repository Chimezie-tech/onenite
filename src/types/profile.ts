import { ReactNode } from "react";

export type Gender = "male" | "female" | "other";
export type InterestedIn = "male" | "female" | "everyone";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type SwipeAction = "like" | "pass" | "super";

export interface ProfileWithPhotos extends Profile {
  profile_photos: ProfilePhoto[];
}

export interface Profile {
  id: string;                  // uuid, primary key
  telegram_id: number;         // unique Telegram user ID
  first_name: string;
  username: string | null;     // Telegram @username (some users don't have one)
  photo_url: string | null;    // primary photo URL
  bio: string;
  age: number;
  orientation: string | null;
  relationship_status: string | null;
  occupation: string | null;
  education: string | null;
  religion: string | null;
  drinking: string | null;
  smoking: string | null;
  nightlife: string | null;
  politics: string | null;
  kids: string | null;
  height_cm: number | null;
  bonus_super_likes: number;
  reveal_until: string | null;
  boosted_until: string | null;
  gender: Gender;
  interested_in: InterestedIn;
  city: string;
  country: string;
  interests: string[];
  is_premium: boolean;
  is_verified: boolean;
  is_banned: boolean;
  premium_expires_at: string | null;
  created_at: string;
  updated_at: string;
  referrer_code: string | null;
  onboarding_completed: boolean;
  last_active_at: string;
}

export interface ProfilePhoto {
  first_name: ReactNode;
  id: string;
  user_id: string;             // FK -> profiles.id
  photo_url: string;
  is_primary: boolean;
  moderation_status: ModerationStatus;
  moderation_reason: string | null;
  created_at: string;
}