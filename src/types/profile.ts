export type Gender = "male" | "female" | "other";
export type InterestedIn = "male" | "female" | "everyone";
export type ModerationStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;                  // uuid, primary key
  telegram_id: number;         // unique Telegram user ID
  first_name: string;
  username: string | null;     // Telegram @username (some users don't have one)
  photo_url: string | null;    // primary photo URL
  bio: string;
  age: number;
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
}

export interface ProfilePhoto {
  id: string;
  user_id: string;             // FK -> profiles.id
  photo_url: string;
  is_primary: boolean;
  moderation_status: ModerationStatus;
  moderation_reason: string | null;
  created_at: string;
}