"use client";
import { useEffect } from "react";

interface Props {
  message: string;
  kind?: "success" | "error";
  onDone: () => void;
}

export default function Toast({ message, kind = "success", onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`fixed left-1/2 top-4 z-[70] -translate-x-1/2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg ${
        kind === "success" ? "bg-emerald-500" : "bg-red-500"
      }`}
    >
      {message}
    </div>
  );
}