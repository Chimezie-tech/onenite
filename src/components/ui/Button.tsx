import { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Button({ children, className, ...props }: Props) {
  return (
    <button
      className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
}