import { MapPin } from "lucide-react";
import { truncate } from "@/lib/utils/helpers";
import type { ProfileWithPhotos } from "@/types";

export default function SwipeCard({ profile }: { profile: ProfileWithPhotos }) {
  const photo =
    profile.profile_photos.find((p) => p.is_primary) ?? profile.profile_photos[0];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-line bg-surface">
      {photo && (
        <img
          src={photo.photo_url}
          alt={profile.first_name}
          draggable={false}
          className="h-full w-full select-none object-cover"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-16">
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