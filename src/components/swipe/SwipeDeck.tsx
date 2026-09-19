"use client";
import { useRef } from "react";
import TinderCard from "react-tinder-card";
import { Heart, Star, X, Loader2, Users } from "lucide-react";
import SwipeCard from "./SwipeCard";
import type { ProfileWithPhotos, SwipeAction } from "@/types";

type Dir = "left" | "right" | "up" | "down";
type Swipeable = { swipe: (dir: Dir) => Promise<void> };

const DIR_TO_ACTION: Record<Dir, SwipeAction> = {
  right: "like",
  left: "pass",
  up: "super",
  down: "pass",
};

interface Props {
  deck: ProfileWithPhotos[];
  loading: boolean;
  onAction: (target: ProfileWithPhotos, action: SwipeAction) => void;
  onGone: (id: string) => void;
  onRefresh: () => void;
  onOpen: (profile: ProfileWithPhotos) => void;
}

export default function SwipeDeck({ deck, loading, onAction, onGone, onRefresh, onOpen }: Props) {
  const refs = useRef<Record<string, Swipeable | null>>({});
  const visible = deck.slice(0, 3);

  function buttonSwipe(dir: Dir) {
    const top = visible[0];
    if (top) void refs.current[top.id]?.swipe(dir);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[420px] w-full">
        {loading && deck.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {!loading && deck.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-6 text-center">
            <Users className="h-8 w-8 text-muted" />
            <p className="font-semibold text-ink">No more profiles nearby</p>
            <p className="text-xs text-muted">
              New people join every day. Invite friends to speed things up!
            </p>
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink"
            >
              Refresh
            </button>
          </div>
        )}

        {visible.map((profile) => (
          <TinderCard
            key={profile.id}
            className="absolute inset-0"
            onSwipe={(dir) => onAction(profile, DIR_TO_ACTION[dir as Dir])}
            onCardLeftScreen={() => onGone(profile.id)}
          >
          <SwipeCard profile={profile} onOpen={() => onOpen(profile)} />
          </TinderCard>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Pass"
          onClick={() => buttonSwipe("left")}
          className="rounded-full border border-line bg-surface p-4 text-red-400 shadow-md"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="Super like"
          onClick={() => buttonSwipe("up")}
          className="rounded-full border border-line bg-surface p-3 text-amber-400 shadow-md"
        >
          <Star className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Like"
          onClick={() => buttonSwipe("right")}
          className="rounded-full border border-line bg-surface p-4 text-pink-500 shadow-md"
        >
          <Heart className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}