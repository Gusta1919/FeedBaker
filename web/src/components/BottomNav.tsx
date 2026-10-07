"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartIcon, FeedIcon, PollsIcon } from "@/components/ui/icons";

const TABS = [
  { href: "/feed", label: "For you", Icon: FeedIcon, id: "feed" },
  {
    href: "/my-polls",
    label: "My polls",
    Icon: PollsIcon,
    id: "my-polls",
  },
  { href: "/my-stats", label: "My stats", Icon: ChartIcon, id: "my-stats" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(id: (typeof TABS)[number]["id"]) {
    if (id === "feed") return pathname === "/feed";
    if (id === "my-polls") {
      return pathname.startsWith("/my-polls") || pathname.startsWith("/create");
    }
    return pathname.startsWith("/my-stats") || pathname.startsWith("/profile");
  }

  return (
    <nav className="app-nav-mobile fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ink pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="nav-bar mx-auto mb-3 mt-2 flex w-[min(24rem,calc(100%-1.5rem))] items-stretch gap-0.5 p-1">
        {TABS.map(({ href, label, Icon, id }) => {
          const active = isActive(id);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold tracking-wide transition-colors ${
                active
                  ? "nav-tab-active rounded-md"
                  : "text-paper-faint hover:text-paper-muted"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
