"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { FREE_DAILY_LIKES } from "@/lib/utils/constants";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PaywallModal({ open, onClose }: Props) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center"
          >
            <Sparkles className="mx-auto h-8 w-8 text-pink-500" />
            <p className="mt-2 text-xl font-bold text-ink">Out of likes for today</p>
            <p className="mt-1 text-sm text-muted">
              Free members get {FREE_DAILY_LIKES} likes per day. Go Premium for unlimited likes,
              5 super likes daily, and more.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/premium");
              }}
              className="mt-5 w-full rounded-xl bg-pink-500 py-3 font-bold text-white"
            >
              Go Premium 💎
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl border border-line py-3 font-semibold text-ink"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}