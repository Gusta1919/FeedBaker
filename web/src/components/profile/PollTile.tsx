import Link from "next/link";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { formatCount, getPercent, timeAgo } from "@/lib/polls/utils";
import { VISIBILITY_LABELS, type Poll } from "@/types/poll";

export function PollTile({ poll, showOwnerMeta }: { poll: Poll; showOwnerMeta?: boolean }) {
  const leader = [...poll.options].sort((a, b) => b.voteCount - a.voteCount)[0];
  const leadPercent = leader ? getPercent(leader.voteCount, poll.totalVotes) : 0;

  return (
    <Link
      href={showOwnerMeta ? `/p/${poll.id}/stats` : `/p/${poll.id}`}
      className="panel-flat group block overflow-hidden transition-colors hover:border-line-strong"
    >
      <div className="flex gap-1 p-1">
        {poll.options.slice(0, 3).map((option) => (
          <div
            key={option.id}
            className="relative aspect-square flex-1 overflow-hidden rounded-2xl bg-black"
          >
            <PhotoFrame src={option.imageUrl} alt={option.label || "Option"} />
          </div>
        ))}
      </div>

      <div className="p-3.5 pt-2.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">
          {poll.question}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/35">
          <span className="font-semibold text-white/55">
            {formatCount(poll.totalVotes)} votes
          </span>
          {poll.canSeeResults && poll.totalVotes > 0 && (
            <>
              <span>·</span>
              <span>{leadPercent}% leader</span>
            </>
          )}
          {showOwnerMeta && (
            <>
              <span>·</span>
              <span>{VISIBILITY_LABELS[poll.visibility]}</span>
            </>
          )}
          <span>·</span>
          <span>{timeAgo(poll.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
