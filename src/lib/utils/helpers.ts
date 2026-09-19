import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

/** "2 minutes ago", "3 hours ago" — for profile cards & match lists */
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Chat timestamps: "14:32" today, "Yesterday", else "12 Mar 2026" */
export function chatTimestamp(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM yyyy");
}

/** Truncate long bios with an ellipsis */
export function truncate(text: string, max = 120): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Safe display name with fallbacks */
export function displayName(first?: string | null, username?: string | null): string {
  return first?.trim() || (username ? `@${username}` : "Anonymous");
}