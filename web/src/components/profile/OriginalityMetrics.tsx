"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  AccentBar,
  CategoryInitial,
  ChipMarker,
  VibeMark,
} from "@/components/profile/OriginalityMarks";
import { fetchVoteInsights } from "@/lib/polls/actions";
import {
  getCategoryMicroLabel,
  getOriginalityHighlights,
} from "@/lib/polls/originality";
import type { VoteInsights } from "@/types/poll";

const VOTED_EVENT = "feedbacker:voted";

type OriginalityMetricsProps = {
  initialInsights: VoteInsights;
};

export function OriginalityMetrics({ initialInsights }: OriginalityMetricsProps) {
  const [insights, setInsights] = useState(initialInsights);
  const [isRefreshing, startRefresh] = useTransition();

  const refresh = useCallback(() => {
    startRefresh(async () => {
      const next = await fetchVoteInsights();
      if (next) setInsights(next);
    });
  }, []);

  useEffect(() => {
    const onVoted = (event: Event) => {
      const detail = (event as CustomEvent<VoteInsights>).detail;
      if (detail) {
        setInsights(detail);
        return;
      }
      refresh();
    };

    const onFocus = () => refresh();

    window.addEventListener(VOTED_EVENT, onVoted);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.removeEventListener(VOTED_EVENT, onVoted);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  const { totalScoredVotes } = insights;
  const {
    overallOriginality,
    vibe,
    categories,
    boldest,
    safest,
    contrarianCategories,
    mainstreamCategories,
  } = getOriginalityHighlights(insights);

  return (
    <section className="panel mt-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Originality metrics
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-paper-muted">
            How often you pick against the crowd
          </p>
        </div>
        {isRefreshing && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-paper-faint">
            Updating…
          </span>
        )}
      </div>

      {totalScoredVotes === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-line bg-surface/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-paper-muted">No votes yet</p>
          <p className="mt-1 text-xs text-paper-faint">
            Vote in the feed to unlock your originality score and vibe.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-hidden rounded-md border border-line bg-surface">
            <div className="border-b border-line bg-ink-soft px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-paper-faint">
                Your vibe
              </p>
              <div className="mt-2 flex items-center gap-3">
                <VibeMark mark={vibe.mark} />
                <p className="font-display text-xl font-semibold tracking-tight">
                  {vibe.title}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-paper-muted">
                {vibe.line}
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-paper-faint">
                    Originality score
                  </p>
                  <p className="font-display mt-1 text-4xl font-semibold tabular-nums text-brand">
                    {overallOriginality}%
                  </p>
                </div>
                <p className="max-w-[9rem] text-right text-[11px] leading-relaxed text-paper-faint">
                  From {totalScoredVotes}{" "}
                  {totalScoredVotes === 1 ? "vote" : "votes"}
                </p>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-paper-faint">
                  <span>Mainstream</span>
                  <span>Original</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-ink-raised">
                  <div className="absolute inset-0 bg-gradient-to-r from-paper-faint/25 via-brand/35 to-brand" />
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-brand shadow-[0_0_0_2px_var(--color-brand-soft)] transition-[left] duration-500"
                    style={{ left: `${overallOriginality}%` }}
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>

          {(boldest || safest) && boldest !== safest && (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {boldest && (
                <HighlightCard
                  label="Boldest take"
                  tone="brand"
                  category={boldest.category}
                  value={boldest.originality}
                  hint="Most original category"
                />
              )}
              {safest && (
                <HighlightCard
                  label="Comfort zone"
                  tone="muted"
                  category={safest.category}
                  value={safest.originality}
                  hint="Most mainstream category"
                />
              )}
            </div>
          )}

          {(contrarianCategories.length > 0 || mainstreamCategories.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {contrarianCategories.slice(0, 3).map((row) => (
                <FunChip
                  key={`hot-${row.category}`}
                  tone="contrarian"
                  text={`${row.category} · contrarian`}
                />
              ))}
              {mainstreamCategories.slice(0, 2).map((row) => (
                <FunChip
                  key={`safe-${row.category}`}
                  tone="classic"
                  text={`${row.category} · classic`}
                />
              ))}
            </div>
          )}

          {categories.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-paper-faint">
                By category
              </p>
              <ul className="space-y-2.5">
                {categories.map((row) => {
                  const micro = getCategoryMicroLabel(row.originality);

                  return (
                    <li
                      key={row.category}
                      className="rounded-md border border-line bg-surface px-3.5 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <CategoryInitial category={row.category} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold">
                                {row.category}
                              </p>
                              {micro && (
                                <span className="chip shrink-0 py-0.5 text-[9px]">
                                  {micro}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-paper-faint">
                              {row.votes} {row.votes === 1 ? "vote" : "votes"}
                            </p>
                          </div>
                        </div>
                        <p className="font-display shrink-0 text-lg font-semibold tabular-nums text-brand">
                          {row.originality}%
                        </p>
                      </div>
                      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink-raised">
                        <div
                          className="h-full rounded-full bg-brand/85 transition-[width] duration-500"
                          style={{ width: `${row.originality}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function HighlightCard({
  label,
  tone,
  category,
  value,
  hint,
}: {
  label: string;
  tone: "brand" | "muted";
  category: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-3.5">
      <div className="flex items-center gap-2">
        <AccentBar tone={tone} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-paper-faint">
          {label}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <CategoryInitial category={category} className="h-7 w-7 text-[9px]" />
        <p className="text-sm font-semibold">{category}</p>
      </div>
      <p className="font-display mt-2 text-2xl font-semibold tabular-nums text-brand">
        {value}%
      </p>
      <p className="mt-1 text-[10px] text-paper-faint">{hint}</p>
    </div>
  );
}

function FunChip({
  tone,
  text,
}: {
  tone: "contrarian" | "classic";
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-paper-muted">
      <ChipMarker tone={tone} />
      {text}
    </span>
  );
}

export function dispatchVoteInsights(insights: VoteInsights) {
  window.dispatchEvent(
    new CustomEvent<VoteInsights>(VOTED_EVENT, { detail: insights }),
  );
}
