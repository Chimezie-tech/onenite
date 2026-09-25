import { useRef } from "react";
import { MapPin } from "lucide-react";
import { truncate } from "@/lib/utils/helpers";
import type { ProfileWithPhotos } from "@/types";

interface Props {
  profile: ProfileWithPhotos;
  onOpen: () => void;
}

export default function SwipeCard({ profile, onOpen }: Props) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const approved = (profile.profile_photos ?? []).filter((p) => p.moderation_status === "approved");
  const photo = approved.find((p) => p.is_primary) ?? approved[0] ?? null;

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = Math.abs(t.clientX - touchStart.current.x);
    const dy = Math.abs(t.clientY - touchStart.current.y);
    const dt = Date.now() - touchStart.current.time;
    if (dx < 15 && dy < 15 && dt < 300) onOpen();
    touchStart.current = null;
  };

  return (
    <div
      className="relative h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface"
      onClick={onOpen}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {photo ? (
        <img src={photo.photo_url} alt={profile.first_name} draggable={false}
          className="pointer-events-none h-full w-full select-none object-cover" />
      ) : profile.photo_url ? (
        <img src={profile.photo_url} alt={profile.first_name} draggable={false}
          className="pointer-events-none h-full w-full select-none object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500/30 via-purple-500/20 to-sky-500/30">
          <span className="text-7xl font-black text-white/60">{profile.first_name.charAt(0)}</span>
        </div>
      )}

      <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
        View profile
      </span>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-16">
        <p className="text-xl font-bold text-white">{profile.first_name}, {profile.age}</p>
        <p className="flex items-center gap-1 text-xs text-white/80">
          <MapPin className="h-3 w-3" /> {profile.city || "Nearby"}
        </p>
        {profile.bio && <p className="mt-1 text-xs text-white/90">{truncate(profile.bio, 90)}</p>}
        <div className="mt-2 flex flex-wrap gap-1">
          {profile.interests.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}