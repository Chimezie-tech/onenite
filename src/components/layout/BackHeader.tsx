"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackHeader({ title }: { title: string }) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <header className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Go back"
        onClick={goBack}
        className="rounded-full border border-line bg-surface p-2 text-ink"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-bold text-ink">{title}</h1>
    </header>
  );
}