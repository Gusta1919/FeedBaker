"use client";

import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { CheckIcon } from "@/components/ui/icons";
import { getPercent } from "@/lib/polls/utils";
import type { PollOption } from "@/types/poll";

type OptionTileProps = {
  option: PollOption;
  index: number;
  total: number;
  displayCount: number;
  totalVotes: number;
  picked: boolean;
  highlightPick?: boolean;
  isWinner: boolean;
  revealed: boolean;
  locked: boolean;
  priority: boolean;
  onPick: () => void;
  variant?: "grid" | "carousel";
};

export function OptionTile({
  option,
  index,
  total,
  displayCount,
  totalVotes,
  picked,
  highlightPick = false,
  isWinner,
  revealed,
  locked,
  priority,
  onPick,
  variant = "grid",
}: OptionTileProps) {
  const percent = getPercent(displayCount, totalVotes);
  const showDim = revealed && !picked && !isWinner;
  const letter = String.fromCharCode(65 + index);
  const isCarousel = variant === "carousel";

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={locked}
      data-option-tile=""
      aria-label={option.label || `Option ${letter}`}
      className={`tile group ${
        isCarousel ? "option-carousel-slide" : ""
      } ${locked ? "" : "tile-interactive cursor-pointer"} ${
        highlightPick ? "tile-picked" : ""
      } ${isWinner && !picked ? "tile-winner" : ""}`}
    >
      <div
        className={`${
          showDim ? "tile-dim absolute inset-0" : "absolute inset-0"
        } ${isCarousel ? "bg-ink-soft" : ""}`}
      >
        <PhotoFrame
          src={option.imageUrl}
          alt={option.label || `Option ${letter}`}
          priority={priority}
          fit={isCarousel ? "contain" : "cover"}
        />
      </div>

      <div className="scrim-bottom pointer-events-none absolute inset-x-0 bottom-0 h-2/5" />

      {!revealed && (
        <span className="badge-letter absolute left-2.5 top-2.5">
          {letter}
        </span>
      )}

      {picked && (
        <span className="badge-letter badge-picked anim-pop absolute left-2.5 top-2.5">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3 text-left">
        {revealed ? (
          <div className="anim-rise space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={`text-2xl font-bold leading-none tabular-nums transition-colors duration-300 ${
                  picked ? "text-brand" : "text-paper"
                }`}
              >
                {percent}
                <span className="text-sm font-semibold">%</span>
              </span>
              {option.label && (
                <span className="truncate text-[11px] font-medium text-white/70">
                  {option.label}
                </span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-paper/12">
              <div
                className={`bar-fill h-full rounded-full ${
                  picked ? "bar-accent" : "bar-muted"
                }`}
                style={{ width: `${Math.max(percent, 2)}%` }}
              />
            </div>
            <p className="text-[10px] font-medium text-paper-faint">
              {displayCount} {displayCount === 1 ? "vote" : "votes"}
            </p>
          </div>
        ) : (
          option.label && (
            <p className="truncate text-sm font-semibold drop-shadow-lg">
              {option.label}
            </p>
          )
        )}
      </div>

      {!locked && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="border border-line-strong bg-ink/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
            {total === 2 ? "Pick" : "Vote"}
          </span>
        </span>
      )}
    </button>
  );
}
