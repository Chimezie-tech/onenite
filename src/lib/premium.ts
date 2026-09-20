import type { Profile } from "@/types";

/** Single source of truth: is this profile premium RIGHT NOW? */
export function isPremiumActive(profile: Profile | null): boolean {
  if (!profile || !profile.is_premium) return false;
  if (!profile.premium_expires_at) return true;
  return new Date(profile.premium_expires_at).getTime() > Date.now();
}