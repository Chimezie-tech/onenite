"use client";
import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  maxRows?: number;
}

export default function AutoGrowTextarea({ value, onChange, placeholder, className, maxRows = 12 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxRows * 24)}px`;
  }, [value, maxRows]);
  return (
    <textarea
      ref={ref}
      rows={2}
      value={value}
      placeholder={placeholder}
      className={className}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}