const brand = "#4a858c";

export default {
  light: {
    text: "#111",
    background: "#fff",
    tint: brand,
    tabIconDefault: "#ccc",
    tabIconSelected: brand,
  },
  dark: {
    text: "#f5f5f4",
    textMuted: "#a8a29e",
    textFaint: "#78716c",
    background: "#0b0b0c",
    surface: "#161618",
    line: "#2a2a2e",
    tint: brand,
    brand,
    tabIconDefault: "#78716c",
    tabIconSelected: brand,
  },
};

export type ThemeColors = typeof import("./Colors").default.dark;
