import { createClient } from "@/lib/supabase/server";
import { buildPoll, type DbPollRow } from "@/lib/polls/utils";
import type {
  Poll,
  Profile,
  UserStats,
  VoteInsights,
} from "@/types/poll";

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

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function loadVoteCounts(
  supabase: SupabaseClient,
  pollIds: string[],
): Promise<Record<string, Record<string, number>>> {
  if (pollIds.length === 0) return {};

  const { data, error } = await supabase.rpc("get_option_vote_counts", {
    p_poll_ids: pollIds,
  });

  const byPoll: Record<string, Record<string, number>> = {};

  if (error || !data) {
    return byPoll;
  }

  for (const row of data as {
    poll_id: string;
    option_id: string;
    vote_count: number;
  }[]) {
    byPoll[row.poll_id] ??= {};
    byPoll[row.poll_id][row.option_id] = Number(row.vote_count);
  }

  return byPoll;
}

async function loadUserVotes(
  supabase: SupabaseClient,
  pollIds: string[],
  userId: string | null,
): Promise<Record<string, string>> {
  if (!userId || pollIds.length === 0) return {};

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

async function hydrate(
  supabase: SupabaseClient,
  rows: DbPollRow[],
  userId: string | null,
): Promise<Poll[]> {
  if (rows.length === 0) return [];

  const pollIds = rows.map((row) => row.id);
  const [voteCounts, userVotes] = await Promise.all([
    loadVoteCounts(supabase, pollIds),
    loadUserVotes(supabase, pollIds, userId),
  ]);

  return rows
    .filter((row) => row.poll_options?.length >= 2)
    .map((row) =>
      buildPoll(row, voteCounts[row.id] ?? {}, userVotes[row.id] ?? null, userId),
    );
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    return {
      id: user.id,
      username: user.email?.split("@")[0] ?? null,
      avatarUrl: null,
      createdAt: user.created_at ?? new Date().toISOString(),
    };
  }

  return {
    id: data.id,
    username: data.username,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
}

const SHOWCASE_FEED_LIMIT = 10;

/** Fixed showcase feed — up to 10 public polls, stable order, loops in the UI. */
export async function getFeed(options?: {
  category?: string | null;
  limit?: number;
}): Promise<Poll[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  const limit = options?.limit ?? SHOWCASE_FEED_LIMIT;

  let query = supabase
    .from("polls")
    .select(POLL_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getFeed]", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as DbPollRow[];
  const polls = await hydrate(supabase, rows, userId);

  return polls.filter((poll) => !poll.isOwner);
}

export async function getPollById(pollId: string): Promise<Poll | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("polls")
    .select(POLL_SELECT)
    .eq("id", pollId)
    .maybeSingle();

  if (error || !data) return null;

  const polls = await hydrate(
    supabase,
    [data as unknown as DbPollRow],
    user?.id ?? null,
  );
  return polls[0] ?? null;
}

export async function getPollsByCreator(creatorId: string): Promise<Poll[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("polls")
    .select(POLL_SELECT)
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return hydrate(supabase, data as unknown as DbPollRow[], user?.id ?? null);
}

export async function getVotedPolls(userId: string): Promise<Poll[]> {
  const supabase = await createClient();

  const { data: votes } = await supabase
    .from("votes")
    .select("poll_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(40);

  const pollIds = (votes ?? []).map((v) => v.poll_id);
  if (pollIds.length === 0) return [];

  const { data } = await supabase
    .from("polls")
    .select(POLL_SELECT)
    .in("id", pollIds);

  if (!data) return [];

  const polls = await hydrate(supabase, data as unknown as DbPollRow[], userId);
  const order = new Map(pollIds.map((id, index) => [id, index]));
  return polls.sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();

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

const EMPTY_INSIGHTS: VoteInsights = {
  overallSimilarity: 0,
  totalScoredVotes: 0,
  categories: [],
};

export async function getUserVoteInsights(
  userId: string,
): Promise<VoteInsights> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_user_vote_insights", {
    p_user_id: userId,
  });

  if (error || !data || typeof data !== "object") {
    return EMPTY_INSIGHTS;
  }

  const payload = data as {
    overallSimilarity?: number;
    totalScoredVotes?: number;
    categories?: {
      category?: string;
      votes?: number;
      similarity?: number;
    }[];
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

export async function getPreviewPolls(limit = 3): Promise<Poll[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("polls")
    .select(POLL_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return hydrate(supabase, data as unknown as DbPollRow[], null);
}
