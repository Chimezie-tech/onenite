import { Suspense } from "react";
import FeedFrictionlessCreative from "@/components/ads/creatives/FeedFrictionlessCreative";

export default function Page() {
  return <Suspense fallback={null}><FeedFrictionlessCreative /></Suspense>;
}