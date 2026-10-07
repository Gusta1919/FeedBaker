"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoBrand } from "@/components/ui/Logo";
import { UserAvatar, displayUsername } from "@/components/ui/UserAvatar";
import { ChartIcon, FeedIcon, PollsIcon } from "@/components/ui/icons";
import { CATEGORY_EMOJI, POLL_CATEGORIES } from "@/types/poll";

export type DesktopRailUser = {
  username: string | null;
  avatarUrl: string | null;
  email?: string | null;
};

const NAV = [
  { href: "/feed", label: "For you", Icon: FeedIcon, id: "feed", requiresAuth: false },
  {
    href: "/my-polls",
    label: "My polls",
    Icon: PollsIcon,
    id: "my-polls" as const,
    requiresAuth: true,
  },
  {
    href: "/my-stats",
    label: "My stats",
    Icon: ChartIcon,
    id: "my-stats" as const,
    requiresAuth: true,
  },
] as const;

type DesktopRailProps = {
  showCategories?: boolean;
  activeCategory?: string | null;
  isAuthenticated?: boolean;
  user?: DesktopRailUser | null;
};

export function DesktopRail({
  showCategories = false,
  activeCategory = null,
  isAuthenticated = false,
  user = null,
}: DesktopRailProps) {
  const pathname = usePathname();

  function isNavActive(id: (typeof NAV)[number]["id"]) {
    if (id === "feed") return pathname === "/feed";
    if (id === "my-polls") {
      return pathname.startsWith("/my-polls") || pathname.startsWith("/create");
    }
    return pathname.startsWith("/my-stats") || pathname.startsWith("/profile");
  }

  return (
    <aside className="desktop-rail">
      <header className="desktop-rail-header">
        <LogoBrand />
      </header>

      <nav className="desktop-rail-nav" aria-label="Main">
        {NAV.map(({ href, label, Icon, id, requiresAuth }) => {
          const active = isNavActive(id);
          const linkHref =
            requiresAuth && !isAuthenticated
              ? `/login?redirect=${encodeURIComponent(href)}`
              : href;

          return (
            <Link
              key={href}
              href={linkHref}
              aria-current={active ? "page" : undefined}
              className={`desktop-rail-link ${active ? "desktop-rail-link-active" : ""}`}
            >
              <Icon className="desktop-rail-icon" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {showCategories && (
        <nav className="desktop-rail-categories" aria-label="Categories">
          <p className="desktop-rail-label">Categories</p>
          <div className="desktop-rail-category-list">
            <CategoryLink href="/feed" label="All polls" active={!activeCategory} />
            {POLL_CATEGORIES.map((category) => (
              <CategoryLink
                key={category}
                href={`/feed?category=${encodeURIComponent(category)}`}
                label={category}
                emoji={CATEGORY_EMOJI[category]}
                active={activeCategory === category}
              />
            ))}
          </div>
        </nav>
      )}

      <div className="desktop-rail-footer">
        {isAuthenticated && user ? (
          <Link href="/my-stats" className="desktop-rail-user">
            <UserAvatar
              username={user.username}
              avatarUrl={user.avatarUrl}
              email={user.email}
              size={44}
            />
            <span className="desktop-rail-user-name">
              {displayUsername(user.username, user.email)}
            </span>
          </Link>
        ) : (
          <Link href="/login?redirect=/feed" className="btn-brand desktop-rail-login">
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
}

function CategoryLink({
  href,
  label,
  emoji,
  active,
}: {
  href: string;
  label: string;
  emoji?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`desktop-rail-category ${active ? "desktop-rail-category-active" : ""}`}
    >
      {emoji && (
        <span className="text-base leading-none" aria-hidden>
          {emoji}
        </span>
      )}
      <span>{label}</span>
    </Link>
  );
}
