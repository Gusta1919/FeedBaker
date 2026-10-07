export type BackgroundId = "solid" | "glow" | "vignette" | "grain";

export type BackgroundMeta = {
  id: BackgroundId;
  name: string;
  description: string;
};

/** Flat dark — default for editorial minimal look */
export const DEFAULT_BACKGROUND: BackgroundId = "solid";

export const BACKGROUNDS: BackgroundMeta[] = [
  {
    id: "solid",
    name: "Solid",
    description: "Flat dark — zero texture, pure minimal",
  },
  {
    id: "glow",
    name: "Glow",
    description: "Soft accent light from the top — warm and calm",
  },
  {
    id: "vignette",
    name: "Vignette",
    description: "Subtle center lift, edges fall away",
  },
  {
    id: "grain",
    name: "Grain",
    description: "Fine film grain — tactile, not geometric",
  },
];

export const BACKGROUND_COOKIE = "feedbacker-bg";

export function isBackgroundId(value: string): value is BackgroundId {
  return BACKGROUNDS.some((bg) => bg.id === value);
}

export function resolveBackgroundId(value: string | undefined): BackgroundId {
  if (value && isBackgroundId(value)) return value;
  return DEFAULT_BACKGROUND;
}
