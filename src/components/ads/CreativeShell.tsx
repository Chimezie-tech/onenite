"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import html2canvas from "html2canvas";

interface Props {
  width: number;
  height: number;
  filename: string;
  children: ReactNode;
}

export default function CreativeShell({ width, height, filename, children }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    function fit() {
      const s = Math.min(
        (window.innerWidth - 32) / width,
        (window.innerHeight - 160) / height,
        1
      );
      setScale(Math.max(0.1, s));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [width, height]);

  async function download() {
    if (!captureRef.current) return;
    const canvas = await html2canvas(captureRef.current, {
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      backgroundColor: null,
      scale: 1,
    });
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-3 bg-neutral-900 p-4">
      {/* Offscreen true-size node used only for capture */}
      <div
        aria-hidden
        ref={captureRef}
        style={{ position: "fixed", left: -4000, top: 0, width, height }}
      >
        {children}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void download()}
          className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-bold text-white"
        >
          ⬇ Download PNG ({width}×{height})
        </button>
        <a href="/ads" className="rounded-lg border border-neutral-600 px-4 py-2 text-sm text-neutral-200">
          ← Back to hub
        </a>
      </div>

      <div
        style={{ width: width * scale, height: height * scale }}
        className="overflow-hidden rounded-xl shadow-2xl"
      >
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>

      <p className="text-xs text-neutral-400">
        Preview at {Math.round(scale * 100)}% — the download exports at exact {width}×{height}px (Meta-ready).
      </p>
    </div>
  );
}