import type { Profile } from "./profile";

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: "active" | "unmatched" | "blocked";
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;            // FK -> matches.id
  sender_id: string;           // FK -> profiles.id
  content: string;
  read_at: string | null;      // null = unread (drives the ✓✓ receipts)
  moderation_status: "pending" | "approved" | "flagged";
  created_at: string;
}

/** A match + the other person's profile + last message: everything the chat list needs */
export interface Conversation {
  match: Match;
  other_user: Profile;
  last_message: Message | null;
  unread_count: number;
}