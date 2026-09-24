import { Suspense } from "react";
import StoryFomoCreative from "@/components/ads/creatives/StoryFomoCreative";

export default function Page() {
  return <Suspense fallback={null}><StoryFomoCreative /></Suspense>;
}