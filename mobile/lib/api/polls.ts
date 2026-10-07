import { supabase } from "../supabase";
import type { Poll, UserStats, VoteInsights } from "../types";
import { buildPoll, type DbPollRow } from "../utils";

const POLL_SELECT = `
  id,
  question,
  category,
  creator_id,
  visibility,
  results_policy,
  results_threshold,
  invite_code,
  created_at,
  profiles:creator_id ( username ),
  poll_options ( id, label, image_url, sort_order )
`;

async function loadVoteCounts(pollIds: string[]) {
  if (pollIds.length === 0) return {} as Record<string, Record<string, number>>;

  const { data } = await supabase.rpc("get_option_vote_counts", {
    p_poll_ids: pollIds,
  });

  const byPoll: Record<string, Record<string, number>> = {};
  for (const row of (data ?? []) as {
    poll_id: string;
    option_id: string;
    vote_count: number;
  }[]) {
    byPoll[row.poll_id] ??= {};
    byPoll[row.poll_id][row.option_id] = Number(row.vote_count);
  }
  return byPoll;
}

async function loadUserVotes(pollIds: string[], userId: string | null) {
  if (!userId || pollIds.length === 0) return {} as Record<string, string>;

  const { data } = await supabase
    .from("votes")
    .select("poll_id, option_id")
    .eq("user_id", userId)
    .in("poll_id", pollIds);

  const map: Record<string, string> = {};
  for (const vote of data ?? []) {
    map[vote.poll_id] = vote.option_id;
  }
  return map;
}

async function hydrate(rows: DbPollRow[], userId: string | null): Promise<Poll[]> {
  if (rows.length === 0) return [];
  const pollIds = rows.map((r) => r.id);
  const [voteCounts, userVotes] = await Promise.all([
    loadVoteCounts(pollIds),
    loadUserVotes(pollIds, userId),
  ]);

  return rows.map((row) =>
    buildPoll(row, voteCounts[row.id] ?? {}, userVotes[row.id] ?? null, userId),
  );
}

const FEED_PAGE_SIZE = 15;

export type FeedPage = {
  polls: Poll[];
  hasMore: boolean;
};

export async function getFeed(
  category?: string | null,
  options?: { after?: string; limit?: number },
): Promise<FeedPage> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  const limit = options?.limit ?? FEED_PAGE_SIZE;

  let query = supabase
    .from("polls")
    .select(POLL_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: true })
    .limit(limit + 1);

  if (category) query = query.eq("category", category);
  if (options?.after) query = query.gt("created_at", options.after);

  const { data, error } = await query;
  if (error || !data) return { polls: [], hasMore: false };

  const rows = data as unknown as DbPollRow[];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const polls = await hydrate(pageRows, userId);

  return {
    polls: polls.filter((poll) => !poll.isOwner),
    hasMore,
  };
}

export async function getPollsByCreator(creatorId: string): Promise<Poll[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("polls")
    .select(POLL_SELECT)
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return hydrate(data as unknown as DbPollRow[], user?.id ?? null);
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase.rpc("get_user_stats", {
    p_user_id: userId,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    return { pollsCreated: 0, votesCast: 0, votesToday: 0, currentStreak: 0 };
  }
  return {
    pollsCreated: Number(row.polls_created ?? 0),
    votesCast: Number(row.votes_cast ?? 0),
    votesToday: Number(row.votes_today ?? 0),
    currentStreak: Number(row.current_streak ?? 0),
  };
}

export async function getUserVoteInsights(userId: string): Promise<VoteInsights> {
  const { data, error } = await supabase.rpc("get_user_vote_insights", {
    p_user_id: userId,
  });
  if (error || !data || typeof data !== "object") {
    return { overallSimilarity: 0, totalScoredVotes: 0, categories: [] };
  }
  const payload = data as {
    overallSimilarity?: number;
    totalScoredVotes?: number;
    categories?: { category?: string; votes?: number; similarity?: number }[];
  };
  return {
    overallSimilarity: Number(payload.overallSimilarity ?? 0),
    totalScoredVotes: Number(payload.totalScoredVotes ?? 0),
    categories: (payload.categories ?? [])
      .filter((row) => row.category)
      .map((row) => ({
        category: row.category as string,
        votes: Number(row.votes ?? 0),
        similarity: Number(row.similarity ?? 0),
      })),
  };
}

export async function voteOnPoll(pollId: string, optionId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Log in to vote." };

  const { error } = await supabase.from("votes").insert({
    poll_id: pollId,
    option_id: optionId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: "You already voted on this one." };
    }
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}
