"use client";

import { ArrowDownIcon, ArrowUpIcon } from "@/components/ui/icons";

type FeedScrollControlsProps = {
  onPrev: () => void;
  onNext: () => void;
};

export function FeedScrollControls({ onPrev, onNext }: FeedScrollControlsProps) {
  return (
    <div className="feed-scroll-controls" aria-label="Scroll polls">
      <button
        type="button"
        onClick={onPrev}
        className="feed-scroll-btn"
        aria-label="Previous poll"
      >
        <ArrowUpIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="feed-scroll-btn"
        aria-label="Next poll"
      >
        <ArrowDownIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
