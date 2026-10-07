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

export type Profile = {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
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

export const CATEGORY_EMOJI: Record<string, string> = {
  Fashion: "👗",
  Style: "💫",
  Beauty: "💄",
  Hair: "💇",
  Skincare: "✨",
  Home: "🛋️",
  Design: "🎨",
  Food: "🍽️",
  Drinks: "☕",
  Travel: "✈️",
  Fitness: "💪",
  Wellness: "🧘",
  Social: "📸",
  Dating: "💌",
  Work: "💼",
  Tech: "📱",
  Gaming: "🎮",
  Music: "🎵",
  Art: "🖼️",
  Photography: "📷",
  Pets: "🐾",
  Plants: "🌿",
  Cars: "🚗",
  Outdoors: "⛰️",
  Wedding: "💍",
  Parenting: "👶",
  Shopping: "🛍️",
  General: "🌍",
};

export function isPollCategory(value: string): value is PollCategory {
  return (POLL_CATEGORIES as readonly string[]).includes(value);
}

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? "🌍";
}

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;

export const VISIBILITY_OPTIONS: {
  value: PollVisibility;
  label: string;
  hint: string;
}[] = [
  {
    value: "public",
    label: "Public",
    hint: "Shows up in everyone's feed",
  },
  {
    value: "unlisted",
    label: "Link only",
    hint: "Hidden from the feed — share the link",
  },
  {
    value: "private",
    label: "Invite only",
    hint: "Only people with your invite code",
  },
];

export const RESULTS_OPTIONS: {
  value: ResultsPolicy;
  label: string;
  hint: string;
}[] = [
  {
    value: "public_live",
    label: "Live for everyone",
    hint: "Percentages visible right away",
  },
  {
    value: "voters_only",
    label: "After voting",
    hint: "People must vote to unlock results",
  },
  {
    value: "after_threshold",
    label: "After N votes",
    hint: "Keep it secret until enough people vote",
  },
  {
    value: "creator_only",
    label: "Only me",
    hint: "You are the only one who sees numbers",
  },
  {
    value: "never_public",
    label: "Never public",
    hint: "Results stay private forever",
  },
];

export const VISIBILITY_LABELS: Record<PollVisibility, string> =
  Object.fromEntries(
    VISIBILITY_OPTIONS.map((o) => [o.value, o.label]),
  ) as Record<PollVisibility, string>;

export const RESULTS_POLICY_LABELS: Record<ResultsPolicy, string> =
  Object.fromEntries(RESULTS_OPTIONS.map((o) => [o.value, o.label])) as Record<
    ResultsPolicy,
    string
  >;
