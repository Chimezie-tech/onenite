import { Suspense } from "react";
import StoryLocalCreative from "@/components/ads/creatives/StoryLocalCreative";

export default function Page() {
  return <Suspense fallback={null}><StoryLocalCreative /></Suspense>;
}