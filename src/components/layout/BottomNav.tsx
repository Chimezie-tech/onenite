"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Heart, MessageCircle, ShoppingBag, User, type LucideIcon } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "likes" | "chats";
}

const TABS: Tab[] = [
  { href: "/", label: "Discover", icon: Flame },
  { href: "/likes", label: "Likes", icon: Heart, badge: "likes" },
  { href: "/matches", label: "Chats", icon: MessageCircle, badge: "chats" },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: User },
];

export const TAB_ROUTES: readonly string[] = TABS.map((t) => t.href);

function badgeText(count: number): string {
  return count > 9 ? "9+" : String(count);
}

export default function BottomNav() {
  const pathname = usePathname();
  const { likesReceived, unreadMessages } = useBadges();

  function countFor(badge?: "likes" | "chats"): number {
    if (badge === "likes") return likesReceived;
    if (badge === "chats") return unreadMessages;
    return 0;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {TABS.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          const count = countFor(badge);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[8px] font-medium ${
                active ? "text-pink-500" : "text-muted"
              }`}
            >
              <span className="relative">
                <Icon className=" h-[20px] w-[20]" />
                {count > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white">
                    {badgeText(count)}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}