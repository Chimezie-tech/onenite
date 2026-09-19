"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ProfileWithPhotos } from "@/types";

interface Props {
  match: ProfileWithPhotos | null;
  myPhotoUrl: string | null;
  onClose: () => void;
}

export default function MatchModal({ match, myPhotoUrl, onClose }: Props) {
  const router = useRouter();
  const matchPhoto =
    match?.profile_photos.find((p) => p.is_primary)?.photo_url ?? null;

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center"
          >
            <p className="text-3xl font-extrabold text-pink-500">It&apos;s a Match! 🎉</p>
            <p className="mt-1 text-sm text-muted">
              You and {match.first_name} liked each other.
            </p>

            <div className="mt-4 flex items-center justify-center gap-3">
              {myPhotoUrl && (
                <img
                  src={myPhotoUrl}
                  alt="You"
                  className="h-20 w-20 rounded-full border-2 border-pink-500 object-cover"
                />
              )}
              {matchPhoto && (
                <img
                  src={matchPhoto}
                  alt={match.first_name}
                  className="h-20 w-20 rounded-full border-2 border-purple-500 object-cover"
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/matches");
              }}
              className="mt-6 w-full rounded-xl bg-pink-500 py-3 font-bold text-white"
            >
              Say Hello 💬
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl border border-line py-3 font-semibold text-ink"
            >
              Keep Swiping
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}