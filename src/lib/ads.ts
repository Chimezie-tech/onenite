import { getSupabase } from "@/lib/supabase/client";
import { getTelegramWebApp } from "@/lib/telegram/sdk";
import type { Ad } from "@/types";

type PushRouter = { push: (href: string) => void };

/** Internal CTA = in-app navigation. External CTA = real browser via Telegram. */
export function openAdCta(ad: Ad, router: PushRouter): void {
  if (ad.cta_type === "internal") {
    router.push(ad.cta_url);
    return;
  }
  const tg = getTelegramWebApp();
  if (tg) tg.openLink(ad.cta_url);
  else window.open(ad.cta_url, "_blank", "noopener");
}

/** Fire-and-forget metrics via the track_ad SQL function. */
/** Fire-and-forget metrics via the track_ad SQL function. */
export async function trackAd(adId: string, event: "impression" | "click"): Promise<void> {
  try {
    await getSupabase().rpc("track_ad", { ad_id: adId, event });
  } catch {
    // Metrics must never break the UI — swallow failures silently.
  }
}