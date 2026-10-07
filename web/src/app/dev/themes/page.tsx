import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ThemePreview } from "./ThemePreview";
import { BACKGROUND_COOKIE, resolveBackgroundId, type BackgroundId } from "@/lib/backgrounds";
import { THEME_COOKIE, resolveThemeId, type ThemeId } from "@/lib/themes";

export default async function ThemesLabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const jar = await cookies();
  const theme: ThemeId = resolveThemeId(jar.get(THEME_COOKIE)?.value);
  const background: BackgroundId = resolveBackgroundId(
    jar.get(BACKGROUND_COOKIE)?.value,
  );

  return (
    <main className="app-shell app-bg min-h-dvh">
      <ThemePreview initialTheme={theme} initialBackground={background} />
    </main>
  );
}
