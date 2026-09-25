/** A user counts as "Online" if active within the last 5 minutes. */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isOnline(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return false;
  const then = new Date(lastActiveAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then < ONLINE_WINDOW_MS;
}