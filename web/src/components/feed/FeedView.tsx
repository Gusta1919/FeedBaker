"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PollCard } from "@/components/feed/PollCard";
import { FeedScrollControls } from "@/components/feed/FeedScrollControls";
import { DesktopRail } from "@/components/layout/DesktopRail";
import { useAutoAdvance } from "@/hooks/useAutoAdvance";
import { LogoMark } from "@/components/ui/Logo";
import { ArrowDownIcon, FlameIcon, PlusIcon } from "@/components/ui/icons";
import { CATEGORY_EMOJI, POLL_CATEGORIES, type Poll } from "@/types/poll";
import type { DesktopRailUser } from "@/components/layout/DesktopRail";

type FeedViewProps = {
  polls: Poll[];
  isAuthenticated: boolean;
  user?: DesktopRailUser | null;
  activeCategory: string | null;
  votesToday: number;
  streak: number;
};

const HINT_KEY = "feedbacker.seen-hint";

export function FeedView({
  polls,
  isAuthenticated,
  user = null,
  activeCategory,
  votesToday,
  streak,
}: FeedViewProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [autoAdvance, setAutoAdvance] = useAutoAdvance();

  const totalVotesToday = votesToday;

  useEffect(() => {
    if (polls.length === 0) return;
    try {
      if (!localStorage.getItem(HINT_KEY)) setShowHint(true);
    } catch {
      // Private browsing can block storage; the hint is optional.
    }
  }, [polls.length]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  const pollCount = polls.length;

  const goTo = useCallback(
    (index: number) => {
      if (pollCount === 0) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const wrapped = ((index % pollCount) + pollCount) % pollCount;
      const slides = scroller.querySelectorAll<HTMLElement>(".feed-slide");
      slides[wrapped]?.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveIndex(wrapped);
    },
    [pollCount],
  );

  const advance = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const slides = Array.from(
      scroller.querySelectorAll<HTMLElement>(".feed-slide"),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = slides.indexOf(entry.target as HTMLElement);
            if (index >= 0) setActiveIndex(index);
          }
        }
      },
      { root: scroller, threshold: 0.6 },
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [polls.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        advance();
        return;
      }
      if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        goTo(activeIndex - 1);
        return;
      }

      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
      ) {
        const scroller = scrollerRef.current;
        const slide = scroller?.querySelectorAll<HTMLElement>(".feed-slide")[
          activeIndex
        ];
        const carousel = slide?.querySelector<HTMLElement>(
          ".option-carousel-scroll",
        );
        if (carousel) {
          event.preventDefault();
          const delta =
            event.key === "ArrowRight"
              ? carousel.clientWidth
              : -carousel.clientWidth;
          carousel.scrollBy({ left: delta, behavior: "smooth" });
        }
        return;
      }

      if (/^[1-4]$/.test(event.key)) {
        const scroller = scrollerRef.current;
        const slide = scroller?.querySelectorAll<HTMLElement>(".feed-slide")[
          activeIndex
        ];
        const tiles = slide?.querySelectorAll<HTMLButtonElement>(
          "[data-option-tile]",
        );
        tiles?.[Number(event.key) - 1]?.click();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, advance, goTo]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || pollCount < 2) return;

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY > 40 && activeIndex === pollCount - 1) {
        event.preventDefault();
        goTo(0);
      } else if (event.deltaY < -40 && activeIndex === 0) {
        event.preventDefault();
        goTo(pollCount - 1);
      }
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [activeIndex, goTo, pollCount]);

  const handleVoted = useCallback(() => {
    dismissHint();
  }, [dismissHint]);

  const progress =
    pollCount > 0 ? ((activeIndex + 1) / pollCount) * 100 : 0;

  if (polls.length === 0) {
    return (
      <>
        <DesktopRail
          showCategories
          activeCategory={activeCategory}
          isAuthenticated={isAuthenticated}
          user={user}
        />
        <div className="feed-desktop-shell">
          <div className="feed-stage-wrap feed-stage-wrap-empty">
            <EmptyFeed
              isAuthenticated={isAuthenticated}
              activeCategory={activeCategory}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DesktopRail
        showCategories
        activeCategory={activeCategory}
        isAuthenticated={isAuthenticated}
        user={user}
      />

      <div className="feed-desktop-shell">
        <div className="feed-stage-wrap">
          <div className="feed-stage">
            <div className="feed-stage-progress pointer-events-none absolute inset-x-0 top-0 z-50 h-[2px] bg-line/60">
              <div
                className="h-full bg-brand/90 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <FeedTopBar
              activeCategory={activeCategory}
              votesToday={totalVotesToday}
              streak={streak}
            />

            <div ref={scrollerRef} className="feed-scroll">
              {polls.map((poll, index) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  index={index}
                  isAuthenticated={isAuthenticated}
                  isActive={index === activeIndex}
                  ephemeralVotes
                  autoAdvance={autoAdvance}
                  onAutoAdvanceChange={setAutoAdvance}
                  onVoted={handleVoted}
                  onAdvance={advance}
                />
              ))}
            </div>
          </div>
        </div>

        <FeedScrollControls
          onPrev={() => goTo(activeIndex - 1)}
          onNext={advance}
        />
      </div>

      {showHint && activeIndex === 0 && (
        <button
          type="button"
          onClick={dismissHint}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-end bg-ink/80 pb-40"
        >
          <div className="anim-rise max-w-xs px-8 text-center">
            <p className="font-display text-lg font-semibold tracking-tight">
              Compare, then pick
            </p>
            <p className="mt-2 text-sm leading-relaxed text-paper-muted">
              The grid shows every option. Swipe right inside the photo area for
              each full-size photo, then tap to vote.
            </p>
            <span className="anim-bob mt-6 inline-flex text-paper-muted">
              <ArrowDownIcon className="h-7 w-7" />
            </span>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper-faint">
              Tap anywhere to start
            </p>
          </div>
        </button>
      )}
    </>
  );
}

function FeedTopBar({
  activeCategory,
  votesToday,
  streak,
}: {
  activeCategory: string | null;
  votesToday: number;
  streak: number;
}) {
  return (
    <div className="feed-top-bar top-bar fixed inset-x-0 top-0 z-40 pt-[max(0.55rem,env(safe-area-inset-top))] lg:hidden">
      <div className="mx-auto flex w-full max-w-[28rem] items-center gap-2 px-4 pb-2.5">
        <Link
          href="/my-stats"
          aria-label="Your stats"
          className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-btn)] bg-surface/80 px-2 py-1.5 transition-colors hover:bg-surface"
        >
          <LogoMark size={20} />
          {streak > 0 && (
            <span className="flex items-center gap-1 pr-0.5 text-[11px] font-semibold text-amber">
              <FlameIcon className="h-3.5 w-3.5" />
              {streak}
            </span>
          )}
        </Link>

        <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
          <CategoryPill href="/feed" label="All" active={!activeCategory} />
          {POLL_CATEGORIES.map((category) => (
            <CategoryPill
              key={category}
              href={`/feed?category=${encodeURIComponent(category)}`}
              label={`${CATEGORY_EMOJI[category]} ${category}`}
              active={activeCategory === category}
            />
          ))}
        </div>

        {votesToday > 0 && (
          <span className="hidden shrink-0 rounded-[var(--radius-btn)] bg-surface/80 px-2.5 py-1.5 text-[10px] font-medium text-paper-muted sm:block">
            {votesToday} today
          </span>
        )}
      </div>
    </div>
  );
}

function CategoryPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`category-pill shrink-0 whitespace-nowrap px-2.5 py-1.5 ${
        active ? "category-pill-active" : "text-paper-muted hover:text-paper"
      }`}
    >
      {label}
    </Link>
  );
}

function EmptyFeed({
  isAuthenticated,
  activeCategory,
}: {
  isAuthenticated: boolean;
  activeCategory: string | null;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8 pb-28 text-center">
      <div className="anim-rise max-w-sm">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center border border-line bg-surface">
          <ArrowDownIcon className="h-5 w-5 text-paper-faint" />
        </div>
        <h2 className="font-display mb-2 text-2xl font-semibold tracking-tight">
          {activeCategory
            ? `Nothing left in ${activeCategory}`
            : "You're all caught up"}
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-paper-muted">
          {activeCategory
            ? "Try another category or start your own poll."
            : "You've seen every public poll. Create one and get opinions in minutes."}
        </p>
        <div className="flex flex-col gap-2.5">
          <Link
            href={isAuthenticated ? "/create" : "/login?redirect=/create"}
            className="btn-brand flex items-center justify-center gap-2 px-7 py-3.5 text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Create a poll
          </Link>
          {activeCategory && (
            <Link href="/feed" className="btn-ghost px-7 py-3.5 text-sm">
              Browse everything
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
