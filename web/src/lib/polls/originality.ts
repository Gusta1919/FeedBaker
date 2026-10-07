import type { CategoryInsight, VoteInsights } from "@/types/poll";

export type OriginalityVibe = {
  title: string;
  mark: "crowd" | "mainstream" | "balanced" | "wildcard" | "contrarian";
  line: string;
};

export function toOriginality(similarity: number): number {
  return Math.max(0, Math.min(100, 100 - similarity));
}

export function getOriginalityVibe(originality: number): OriginalityVibe {
  if (originality >= 81) {
    return {
      title: "Full contrarian",
      mark: "contrarian",
      line: "If everyone's on A, you're already voting D.",
    };
  }
  if (originality >= 61) {
    return {
      title: "Certified wildcard",
      mark: "wildcard",
      line: "You love an underdog photo. The majority is not invited.",
    };
  }
  if (originality >= 41) {
    return {
      title: "Perfectly unpredictable",
      mark: "balanced",
      line: "Half crowd, half chaos. Nobody knows your next pick.",
    };
  }
  if (originality >= 21) {
    return {
      title: "Mostly mainstream",
      mark: "mainstream",
      line: "You usually ride the wave — with the occasional plot twist.",
    };
  }
  return {
    title: "Crowd favorite",
    mark: "crowd",
    line: "Popular picks only. Safe, solid, very on-brand for the algorithm.",
  };
}

export function getCategoryOriginality(row: CategoryInsight) {
  return {
    ...row,
    originality: toOriginality(row.similarity),
  };
}

export function getOriginalityHighlights(insights: VoteInsights) {
  const overallOriginality = toOriginality(insights.overallSimilarity);
  const vibe = getOriginalityVibe(overallOriginality);

  const categories = insights.categories
    .map(getCategoryOriginality)
    .sort((a, b) => b.originality - a.originality);

  const boldest = categories[0] ?? null;
  const safest = categories.length > 0 ? categories[categories.length - 1] : null;

  const contrarianCategories = categories.filter((row) => row.originality >= 60);
  const mainstreamCategories = categories.filter((row) => row.originality <= 35);

  return {
    overallOriginality,
    vibe,
    categories,
    boldest,
    safest,
    contrarianCategories,
    mainstreamCategories,
  };
}

export function getCategoryMicroLabel(originality: number): string | null {
  if (originality >= 75) return "Hot take";
  if (originality >= 55) return "Spicy";
  if (originality <= 25) return "Safe pick";
  if (originality <= 15) return "Crowd classic";
  return null;
}
