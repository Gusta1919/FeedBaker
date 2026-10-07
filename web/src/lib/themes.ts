export type ThemeId = "editorial" | "gallery" | "signal" | "atelier" | "noir";

export type ThemeMeta = {
  id: ThemeId;
  name: string;
  tagline: string;
  accent: string;
  mood: string;
  fonts: { display: string; body: string };
  palette: { bg: string; surface: string; text: string };
};

/** Saved default — the one you approved. */
export const DEFAULT_THEME: ThemeId = "editorial";

export const THEMES: ThemeMeta[] = [
  {
    id: "editorial",
    name: "Editorial",
    tagline: "Minimal calm — petrol teal accent, smooth motion, big type",
  accent: "#4a858c",
  mood: "Minimal and calm — cool petrol teal, smooth motion, big type.",
    fonts: { display: "Inter", body: "Inter" },
    palette: { bg: "#0b0b0c", surface: "#131314", text: "#e8e6e1" },
  },
  {
    id: "gallery",
    name: "Gallery",
    tagline: "Serif headlines, monochrome restraint, exhibition calm",
    accent: "#f4f4f2",
    mood: "Quiet luxury. Typography carries the whole interface.",
    fonts: { display: "Cormorant Garamond", body: "Inter" },
    palette: { bg: "#090909", surface: "#111111", text: "#f4f4f2" },
  },
  {
    id: "signal",
    name: "Signal",
    tagline: "Brutalist squares, chartreuse signal, poster energy",
    accent: "#d4ff00",
    mood: "Loud and direct. Zero decoration, maximum contrast.",
    fonts: { display: "Archivo Black", body: "DM Sans" },
    palette: { bg: "#030303", surface: "#0a0a0a", text: "#efefec" },
  },
  {
    id: "atelier",
    name: "Atelier",
    tagline: "Soft serif, terracotta warmth, rounded organic shapes",
    accent: "#c4784a",
    mood: "Human and tactile. Feels like a creative studio.",
    fonts: { display: "Fraunces", body: "Source Sans 3" },
    palette: { bg: "#12100e", surface: "#181512", text: "#ede8df" },
  },
  {
    id: "noir",
    name: "Noir",
    tagline: "Cinematic blue-black, gold accents, evening elegance",
    accent: "#c4a35a",
    mood: "Refined and cinematic. Premium without being flashy.",
    fonts: { display: "Bodoni Moda", body: "Libre Franklin" },
    palette: { bg: "#07070f", surface: "#0e0e18", text: "#e4e2dc" },
  },
];

export const THEME_COOKIE = "feedbacker-theme";

const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  mono: "gallery",
  lime: "signal",
  warm: "atelier",
};

export function normalizeThemeId(value: string): ThemeId | null {
  if (THEMES.some((theme) => theme.id === value)) return value as ThemeId;
  return LEGACY_THEME_MAP[value] ?? null;
}

export function isThemeId(value: string): value is ThemeId {
  return normalizeThemeId(value) !== null;
}

export function resolveThemeId(value: string | undefined): ThemeId {
  if (!value) return DEFAULT_THEME;
  return normalizeThemeId(value) ?? DEFAULT_THEME;
}
