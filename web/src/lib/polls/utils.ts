import type { Poll, PollOption, ResultsPolicy } from "@/types/poll";

export type DbPollRow = {
  id: string;
  question: string;
  category: string;
  creator_id: string;
  visibility: Poll["visibility"];
  results_policy: ResultsPolicy;
  results_threshold: number | null;
  invite_code: string | null;
  created_at: string;
  profiles: { username: string | null } | { username: string | null }[] | null;
  poll_options: {
    id: string;
    label: string;
    image_url: string;
    sort_order: number;
  }[];
};

export function getProfileUsername(profiles: DbPollRow["profiles"]): string {
  if (!profiles) return "someone";
  if (Array.isArray(profiles)) return profiles[0]?.username ?? "someone";
  return profiles.username ?? "someone";
}

/**
 * Single source of truth for result visibility. Called on the server when
 * building a poll and again on the client after an optimistic vote, since
 * voting can unlock results that were hidden a moment earlier.
 */
export function resultsVisible(
  poll: {
    resultsPolicy: ResultsPolicy;
    resultsThreshold: number | null;
    isOwner: boolean;
  },
  context: { hasVoted: boolean; totalVotes: number },
): boolean {
  if (poll.isOwner) return true;

  switch (poll.resultsPolicy) {
    case "public_live":
      return true;
    case "voters_only":
      return context.hasVoted;
    case "after_threshold":
      return (
        context.hasVoted &&
        poll.resultsThreshold !== null &&
        context.totalVotes >= poll.resultsThreshold
      );
    case "creator_only":
    case "never_public":
      return false;
    default:
      return false;
  }
}

export function buildPoll(
  row: DbPollRow,
  voteCounts: Record<string, number>,
  userVoteOptionId: string | null,
  userId: string | null,
): Poll {
  const options: PollOption[] = [...row.poll_options]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((option) => ({
      id: option.id,
      label: option.label,
      imageUrl: option.image_url,
      sortOrder: option.sort_order,
      voteCount: voteCounts[option.id] ?? 0,
    }));

  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);
  const hasVoted = Boolean(userVoteOptionId);
  const isOwner = Boolean(userId) && userId === row.creator_id;

  return {
    id: row.id,
    question: row.question,
    category: row.category,
    creatorId: row.creator_id,
    creatorUsername: getProfileUsername(row.profiles),
    visibility: row.visibility,
    resultsPolicy: row.results_policy,
    resultsThreshold: row.results_threshold,
    inviteCode: row.invite_code,
    totalVotes,
    options,
    createdAt: row.created_at,
    userVoteOptionId,
    canSeeResults: resultsVisible(
      {
        resultsPolicy: row.results_policy,
        resultsThreshold: row.results_threshold,
        isOwner,
      },
      { hasVoted, totalVotes },
    ),
    isOwner,
  };
}

export function getPercent(count: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function generateInviteCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatCount(value: number) {
  if (value < 1000) return String(value);
  if (value < 10_000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value / 1000)}k`;
}

/** Deterministic-ish shuffle so the feed feels fresh without repeating within a session. */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
