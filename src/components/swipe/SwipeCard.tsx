import { useRef } from "react";
import { MapPin } from "lucide-react";
import { truncate } from "@/lib/utils/helpers";
import type { ProfileWithPhotos } from "@/types";

interface Props {
  profile: ProfileWithPhotos;
  onOpen: () => void;
}

export default function SwipeCard({ profile, onOpen }: Props) {
  const photo =
    profile.profile_photos.find((p) => p.is_primary) ?? profile.profile_photos[0];

  // Track touch to differentiate a TAP from a SWIPE
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - touchStart.current.x);
    const dy = Math.abs(touch.clientY - touchStart.current.y);
    const dt = Date.now() - touchStart.current.time;

    // If finger moved less than 15px and took less than 300ms, it's a TAP, not a SWIPE
    if (dx < 15 && dy < 15 && dt < 300) {
      onOpen();
    }
    touchStart.current = null;
  };

  return (
    <div
      className="relative h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface"
      onClick={onOpen} // Fallback for desktop mouse clicks
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {photo && (
        <img
          src={photo.photo_url}
          alt={profile.first_name}
          draggable={false}
          // pointer-events-none ensures touches pass through to the parent container
          className="pointer-events-none h-full w-full select-none object-cover" 
        />
      )}

      {/* "View profile" chip - explicitly catches taps and stops the swipe event */}
      <button
        type="button"
        aria-label="View full profile"
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
        onTouchEnd={(e) => { e.stopPropagation(); onOpen(); }}
        className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur"
      >
        View profile
      </button>

      {/* pointer-events-none ensures touches pass through to the parent container */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-16">
        <p className="text-xl font-bold text-white">
          {profile.first_name}, {profile.age}
        </p>
        <p className="flex items-center gap-1 text-xs text-white/80">
          <MapPin className="h-3 w-3" /> {profile.city}
        </p>
        {profile.bio && (
          <p className="mt-1 text-xs text-white/90">{truncate(profile.bio, 90)}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {profile.interests.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}