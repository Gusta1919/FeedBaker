"use client";

import { useEffect } from "react";
import {
  BACKGROUND_COOKIE,
  resolveBackgroundId,
  type BackgroundId,
} from "@/lib/backgrounds";
import { THEME_COOKIE, resolveThemeId, type ThemeId } from "@/lib/themes";

export function ThemeProvider({
  theme,
  background,
  children,
}: {
  theme: ThemeId;
  background: BackgroundId;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.bg = background;
  }, [theme, background]);

  return children;
}

export function setThemeCookie(theme: ThemeId) {
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`;
  document.documentElement.dataset.theme = theme;
}

export function setBackgroundCookie(background: BackgroundId) {
  document.cookie = `${BACKGROUND_COOKIE}=${background};path=/;max-age=31536000;SameSite=Lax`;
  document.documentElement.dataset.bg = background;
}

export function readThemeCookie(): ThemeId {
  if (typeof document === "undefined") return "editorial";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]+)`),
  );
  return resolveThemeId(match?.[1]);
}
