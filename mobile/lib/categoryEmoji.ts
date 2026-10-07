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

export function getCategoryEmoji(category: string) {
  return CATEGORY_EMOJI[category] ?? "🌍";
}
