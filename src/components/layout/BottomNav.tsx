"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Heart, MessageCircle, ShoppingBag, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Discover", icon: Flame },
  { href: "/likes", label: "Likes", icon: Heart },
  { href: "/matches", label: "Chats", icon: MessageCircle },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export const TAB_ROUTES: readonly string[] = TABS.map((t) => t.href);

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                active ? "text-pink-500" : "text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}