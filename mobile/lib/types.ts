export type PollVisibility = "public" | "unlisted" | "private";

export type ResultsPolicy =
  | "public_live"
  | "voters_only"
  | "creator_only"
  | "after_threshold"
  | "never_public";

export type PollOption = {
  id: string;
  label: string;
  imageUrl: string;
  sortOrder: number;
  voteCount: number;
};

export type Poll = {
  id: string;
  question: string;
  category: string;
  creatorId: string;
  creatorUsername: string;
  visibility: PollVisibility;
  resultsPolicy: ResultsPolicy;
  resultsThreshold: number | null;
  inviteCode: string | null;
  totalVotes: number;
  options: PollOption[];
  createdAt: string;
  userVoteOptionId: string | null;
  canSeeResults: boolean;
  isOwner: boolean;
};

export type UserStats = {
  pollsCreated: number;
  votesCast: number;
  votesToday: number;
  currentStreak: number;
};

export type CategoryInsight = {
  category: string;
  votes: number;
  similarity: number;
};

export type VoteInsights = {
  overallSimilarity: number;
  totalScoredVotes: number;
  categories: CategoryInsight[];
};

export const POLL_CATEGORIES = [
  "Fashion",
  "Style",
  "Beauty",
  "Hair",
  "Skincare",
  "Home",
  "Design",
  "Food",
  "Drinks",
  "Travel",
  "Fitness",
  "Wellness",
  "Social",
  "Dating",
  "Work",
  "Tech",
  "Gaming",
  "Music",
  "Art",
  "Photography",
  "Pets",
  "Plants",
  "Cars",
  "Outdoors",
  "Wedding",
  "Parenting",
  "Shopping",
  "General",
] as const;

export type PollCategory = (typeof POLL_CATEGORIES)[number];

export function isPollCategory(value: string): value is PollCategory {
  return (POLL_CATEGORIES as readonly string[]).includes(value);
}
