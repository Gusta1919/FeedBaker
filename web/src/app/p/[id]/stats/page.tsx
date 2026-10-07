import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { ShareStatsActions } from "@/components/ShareStatsActions";
import { getCurrentUser, getPollById } from "@/lib/polls/queries";
import { formatCount, getPercent, timeAgo } from "@/lib/polls/utils";
import {
  CATEGORY_EMOJI,
  RESULTS_POLICY_LABELS,
  VISIBILITY_LABELS,
} from "@/types/poll";

export const dynamic = "force-dynamic";

type StatsPageProps = { params: Promise<{ id: string }> };

export default async function StatsPage({ params }: StatsPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/p/${id}/stats`);

  const poll = await getPollById(id);
  if (!poll) notFound();
  if (poll.creatorId !== user.id) redirect(`/p/${id}`);

  const ranked = [...poll.options].sort((a, b) => b.voteCount - a.voteCount);
  const winner = ranked[0];
  const runnerUp = ranked[1];
  const margin =
    winner && runnerUp
      ? getPercent(winner.voteCount, poll.totalVotes) -
        getPercent(runnerUp.voteCount, poll.totalVotes)
      : 0;

  return (
    <main className="app-shell app-bg">
      <div className="relative z-10 mx-auto max-w-lg px-4 pb-16 pt-8">
        <Link
          href="/my-polls"
          className="text-xs font-medium text-white/40 transition-colors hover:text-white"
        >
          ← Back to profile
        </Link>

        <header className="mt-5">
          <span className="chip mb-3">
            <span aria-hidden>{CATEGORY_EMOJI[poll.category] ?? "🌍"}</span>
            {poll.category}
          </span>
          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            {poll.question}
          </h1>
          <p className="mt-2 text-xs text-white/35">
            Posted {timeAgo(poll.createdAt)}
          </p>
        </header>

        <dl className="mt-6 grid grid-cols-3 gap-2.5">
          <Stat label="Total votes" value={formatCount(poll.totalVotes)} />
          <Stat
            label="Winner"
            value={
              poll.totalVotes > 0
                ? `${getPercent(winner?.voteCount ?? 0, poll.totalVotes)}%`
                : "—"
            }
            accent
          />
          <Stat
            label="Margin"
            value={poll.totalVotes > 0 ? `${margin} pts` : "—"}
          />
        </dl>

        <section className="mt-6 space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
            Breakdown
          </h2>
          {ranked.map((option, index) => {
            const percent = getPercent(option.voteCount, poll.totalVotes);
            return (
              <div
                key={option.id}
                className={`panel-flat flex items-center gap-3.5 p-3 ${
                  index === 0 && poll.totalVotes > 0
                    ? "ring-1 ring-brand/40"
                    : ""
                }`}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black">
                  <PhotoFrame
                    src={option.imageUrl}
                    alt={option.label || `Option ${index + 1}`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {option.label || `Option ${index + 1}`}
                    </span>
                    <span
                      className={`shrink-0 text-lg font-bold tabular-nums ${
                        index === 0 && poll.totalVotes > 0 ? "text-brand" : ""
                      }`}
                    >
                      {percent}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`bar-fill h-full ${
                        index === 0 ? "bar-accent" : "bar-muted"
                      }`}
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-white/35">
                    {option.voteCount}{" "}
                    {option.voteCount === 1 ? "vote" : "votes"}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="panel-flat mt-6 divide-y divide-line">
          <Row label="Visibility" value={VISIBILITY_LABELS[poll.visibility]} />
          <Row
            label="Results"
            value={
              poll.resultsPolicy === "after_threshold"
                ? `After ${poll.resultsThreshold} votes`
                : RESULTS_POLICY_LABELS[poll.resultsPolicy]
            }
          />
          {poll.inviteCode && (
            <Row label="Invite code" value={poll.inviteCode} mono />
          )}
        </section>

        <ShareStatsActions pollId={poll.id} />
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="panel-flat p-3.5 text-center">
      <dt
        className={`text-xl font-bold tabular-nums ${accent ? "text-brand" : ""}`}
      >
        {value}
      </dt>
      <dd className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
        {label}
      </dd>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-xs text-white/40">{label}</span>
      <span
        className={`text-xs font-semibold ${mono ? "font-mono tracking-[0.18em] text-brand" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
