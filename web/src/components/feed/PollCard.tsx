"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { OptionTile } from "@/components/feed/OptionTile";
import { dispatchVoteInsights } from "@/components/profile/OriginalityMetrics";
import { useToast } from "@/components/ui/Toast";
import { ChartIcon, ShareIcon, SkipIcon } from "@/components/ui/icons";
import { voteOnPoll } from "@/lib/polls/actions";
import { formatCount, getPercent, timeAgo } from "@/lib/polls/utils";
import type { Poll, PollOption } from "@/types/poll";

type PollCardProps = {
  poll: Poll;
  index: number;
  isAuthenticated: boolean;
  isActive?: boolean;
  ephemeralVotes?: boolean;
  autoAdvance?: boolean;
  onAutoAdvanceChange?: (enabled: boolean) => void;
  onVoted?: (pollId: string, optionId: string) => void;
  onAdvance?: () => void;
  showChrome?: boolean;
};

const GRID_CLASS: Record<number, string> = {
  2: "option-grid-2",
  3: "option-grid-3",
  4: "option-grid-4",
};

export function PollCard({
  poll,
  index,
  isAuthenticated,
  isActive = true,
  ephemeralVotes = false,
  autoAdvance = false,
  onAutoAdvanceChange,
  onVoted,
  onAdvance,
  showChrome = true,
}: PollCardProps) {
  const { notify } = useToast();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [pickedId, setPickedId] = useState<string | null>(
    ephemeralVotes ? null : poll.userVoteOptionId,
  );

  useEffect(() => {
    if (ephemeralVotes) return;
    setPickedId(poll.userVoteOptionId);
  }, [ephemeralVotes, poll.userVoteOptionId]);

  useEffect(() => {
    if (!ephemeralVotes || isActive) return;

    setPickedId(null);
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
      setCarouselIndex(0);
    }
  }, [ephemeralVotes, isActive]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const cloneIndex = poll.options.length + 1;
    let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;

    const jumpFromClone = () => {
      if (poll.options.length <= 1 || carousel.clientWidth === 0) return;

      const index = Math.round(carousel.scrollLeft / carousel.clientWidth);
      if (index < cloneIndex) return;

      carousel.style.scrollSnapType = "none";
      carousel.style.scrollBehavior = "auto";
      carousel.scrollLeft = 0;
      requestAnimationFrame(() => {
        carousel.style.scrollSnapType = "";
        carousel.style.scrollBehavior = "";
        setCarouselIndex(0);
      });
    };

    const syncCarousel = () => {
      if (carousel.clientWidth === 0) return;
      const index = Math.round(carousel.scrollLeft / carousel.clientWidth);
      setCarouselIndex(index >= cloneIndex ? 0 : index);
    };

    const onScrollEnd = () => {
      clearTimeout(scrollEndTimer);
      jumpFromClone();
    };

    const onScroll = () => {
      syncCarousel();
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(jumpFromClone, 450);
    };

    syncCarousel();
    carousel.addEventListener("scroll", onScroll, { passive: true });
    carousel.addEventListener("scrollend", onScrollEnd);

    return () => {
      carousel.removeEventListener("scroll", onScroll);
      carousel.removeEventListener("scrollend", onScrollEnd);
      if (scrollEndTimer) clearTimeout(scrollEndTimer);
    };
  }, [poll.id, poll.options.length]);

  const lastCarouselIndex = poll.options.length;

  const onGridSlide = carouselIndex === 0;

  const hasVoted = Boolean(pickedId);

  const carouselHint = useMemo(() => {
    if (hasVoted || poll.options.length <= 1) return null;
    if (carouselIndex === 0) return "Swipe right for full photos";
    if (carouselIndex < lastCarouselIndex) return "Swipe for more photos";
    return "Swipe right for all photos";
  }, [carouselIndex, hasVoted, lastCarouselIndex, poll.options.length]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const option of poll.options) {
      map[option.id] =
        option.voteCount +
        (pickedId === option.id &&
        (ephemeralVotes || !poll.userVoteOptionId)
          ? 1
          : 0);
    }
    return map;
  }, [ephemeralVotes, pickedId, poll.options, poll.userVoteOptionId]);

  const totalVotes = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const maxCount = Math.max(...Object.values(counts), 0);
  const agreement = pickedId ? getPercent(counts[pickedId] ?? 0, totalVotes) : 0;
  const revealed = hasVoted;

  const scheduleAdvance = () => {
    if (!autoAdvance || !onAdvance) return;
    window.setTimeout(() => onAdvance(), 1500);
  };

  const handlePick = (optionId: string) => {
    if (hasVoted || isPending) return;

    if (!isAuthenticated) {
      notify("Log in to vote — it takes 10 seconds", "info");
      return;
    }

    setPickedId(optionId);

    startTransition(async () => {
      if (ephemeralVotes) {
        onVoted?.(poll.id, optionId);
        scheduleAdvance();
        return;
      }

      const result = await voteOnPoll(poll.id, optionId);

      if (!result.ok) {
        setPickedId(poll.userVoteOptionId);
        notify(result.error ?? "Could not save your vote", "error");
        return;
      }

      if (result.insights) {
        dispatchVoteInsights(result.insights);
      }

      onVoted?.(poll.id, optionId);
      scheduleAdvance();
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${poll.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: poll.question, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify("Link copied", "success");
    } catch {
      notify("Could not share this poll", "error");
    }
  };

  const gridClass = GRID_CLASS[poll.options.length] ?? GRID_CLASS[2];

  const buildTileProps = (
    option: PollOption,
    optionIndex: number,
    variant: "grid" | "carousel",
  ) => {
    const picked = pickedId === option.id;
    return {
      option,
      index: optionIndex,
      total: poll.options.length,
      displayCount: counts[option.id] ?? 0,
      totalVotes,
      picked,
      highlightPick: picked && variant === "grid" && onGridSlide,
      isWinner:
        revealed && totalVotes > 0 && (counts[option.id] ?? 0) === maxCount,
      revealed,
      locked: hasVoted || isPending,
      priority: index < 2 && optionIndex === 0,
      onPick: () => handlePick(option.id),
    };
  };

  const renderGridSlide = (id: "start" | "end") => {
    const isClone = id === "end";

    return (
      <div
        key={`grid-${id}`}
        className={`option-carousel-slide option-carousel-grid-slide${
          isClone ? " pointer-events-none" : ""
        }`}
        aria-hidden={isClone ? true : undefined}
      >
        <div className={`option-grid ${gridClass}`}>
          {poll.options.map((option, optionIndex) => {
            const props = buildTileProps(option, optionIndex, "grid");
            return (
              <OptionTile
                key={`${id}-${option.id}`}
                {...props}
                locked={isClone ? true : props.locked}
                variant="grid"
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="feed-slide" data-poll-id={poll.id}>
      <div className="relative mx-auto flex h-full w-full max-w-[28rem] flex-col px-4 pb-[5.75rem] lg:max-w-none lg:px-7 lg:pb-6">
        <div className="scrim-top pointer-events-none absolute inset-x-0 top-0 z-20 h-40" />

        <header className="relative z-30 pt-[max(3.75rem,calc(env(safe-area-inset-top)+3.25rem))] lg:pt-8">
          <p className="poll-meta mb-3">
            <span className="poll-meta-accent">{poll.category}</span>
            <span>
              {" "}
              · @{poll.creatorUsername} · {timeAgo(poll.createdAt)}
            </span>
          </p>

          <h2 className="poll-question">{poll.question}</h2>
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col py-4">
          <div
            ref={carouselRef}
            className="option-carousel-scroll no-scrollbar min-h-0 flex-1"
          >
            {renderGridSlide("start")}

            {poll.options.map((option, optionIndex) => (
              <OptionTile
                key={`${option.id}-full`}
                {...buildTileProps(option, optionIndex, "carousel")}
                variant="carousel"
              />
            ))}

            {poll.options.length > 1 && renderGridSlide("end")}
          </div>

          {carouselHint && (
            <p className="mt-2 text-center text-[10px] font-medium tracking-wide text-paper-faint">
              {carouselHint}
            </p>
          )}
        </div>

        <footer className="relative z-30 flex h-16 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center">
            {hasVoted ? (
              <div className="anim-reveal min-w-0 truncate border border-line/80 bg-surface/80 px-3.5 py-2.5 text-sm font-medium text-paper backdrop-blur-sm">
                You&apos;re with{" "}
                <span className="font-semibold text-brand">{agreement}%</span> of
                voters
                <span className="font-normal text-paper-faint">
                  {" "}
                  · {formatCount(totalVotes)}{" "}
                  {totalVotes === 1 ? "vote" : "votes"}
                </span>
              </div>
            ) : !isAuthenticated ? (
              <Link
                href={`/login?redirect=/p/${poll.id}`}
                className="btn-brand px-6 py-2.5 text-sm"
              >
                Log in to vote
              </Link>
            ) : (
              <p className="text-[11px] font-medium tracking-wide text-paper-faint">
                Tap to vote
              </p>
            )}
          </div>

          {showChrome && (
            <div className="flex shrink-0 items-center gap-2">
              {poll.isOwner && (
                <Link
                  href={`/p/${poll.id}/stats`}
                  aria-label="Stats"
                  className="btn-ghost flex h-9 w-9 items-center justify-center"
                >
                  <ChartIcon className="h-[18px] w-[18px]" />
                </Link>
              )}

              <ActionButton label="Share" onClick={handleShare}>
                <ShareIcon className="h-[18px] w-[18px]" />
              </ActionButton>

              {onAutoAdvanceChange && (
                <AutoAdvanceButton
                  enabled={autoAdvance}
                  onToggle={() => onAutoAdvanceChange(!autoAdvance)}
                />
              )}
            </div>
          )}
        </footer>
      </div>
    </section>
  );
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="btn-ghost flex h-9 w-9 items-center justify-center"
    >
      {children}
    </button>
  );
}

function AutoAdvanceButton({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={
        enabled
          ? "Auto-advance after voting is on"
          : "Auto-advance after voting is off"
      }
      onClick={onToggle}
      className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-btn)] border transition-colors ${
        enabled
          ? "border-brand bg-brand text-paper"
          : "border-line bg-ink text-paper"
      }`}
    >
      <SkipIcon className="h-[18px] w-[18px]" />
    </button>
  );
}
