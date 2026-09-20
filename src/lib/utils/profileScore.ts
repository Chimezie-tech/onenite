import type { Profile } from "@/types";

/** 0–100 completeness score — the retention hook ("finish your profile!") */
export function profileScore(p: Profile, approvedPhotos: number): number {
  let score = 0;
  if (approvedPhotos >= 1) score += 25;
  if (approvedPhotos >= 3) score += 10;
  if (p.bio && p.bio.trim().length >= 40) score += 15;
  if (p.interests.length >= 3) score += 15;
  const optional = [
    p.orientation, p.relationship_status, p.drinking, p.smoking,
    p.nightlife, p.politics, p.religion, p.education, p.kids, p.occupation,
  ];
  score += Math.round((optional.filter(Boolean).length / optional.length) * 25);
  if (p.height_cm) score += 5;
  return Math.min(100, score);
}