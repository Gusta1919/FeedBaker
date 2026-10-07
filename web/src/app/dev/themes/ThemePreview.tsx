"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/ui/Logo";
import { setBackgroundCookie, setThemeCookie } from "@/components/ThemeProvider";
import {
  BACKGROUNDS,
  type BackgroundId,
} from "@/lib/backgrounds";
import {
  DEFAULT_THEME,
  THEMES,
  type ThemeId,
  type ThemeMeta,
} from "@/lib/themes";

type ThemePreviewProps = {
  initialTheme: ThemeId;
  initialBackground: BackgroundId;
};

export function ThemePreview({
  initialTheme,
  initialBackground,
}: ThemePreviewProps) {
  const router = useRouter();
  const [active, setActive] = useState<ThemeId>(initialTheme);
  const [bg, setBg] = useState<BackgroundId>(initialBackground);

  const pick = (id: ThemeId) => {
    setActive(id);
    setThemeCookie(id);
    router.refresh();
  };

  const pickBg = (id: BackgroundId) => {
    setBg(id);
    setBackgroundCookie(id);
    router.refresh();
  };

  const current = THEMES.find((theme) => theme.id === active)!;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 pb-28">
      <header className="mb-10 border-b border-line pb-8">
        <p className="chip mb-4">Theme lab · 5 looks</p>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Choose the identity
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-paper-muted">
          Each theme is a full system — fonts, spacing, radius, background
          texture, and colour. <strong className="text-paper">Editorial</strong>{" "}
          is saved. Tap one to preview it live across the whole app.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={theme.id === active}
            isDefault={theme.id === DEFAULT_THEME}
            onSelect={() => pick(theme.id)}
          />
        ))}
      </div>

      <section className="mt-8">
        <p className="chip mb-3">Background</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BACKGROUNDS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => pickBg(item.id)}
              className={`panel p-3 text-left transition-colors ${
                bg === item.id ? "border-brand" : "hover:border-line-strong"
              }`}
            >
              <span className="block text-sm font-medium">{item.name}</span>
              <span className="mt-1 block text-[10px] leading-snug text-paper-faint">
                {item.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="chip mb-2">Live preview</p>
            <h2 className="font-display text-2xl font-semibold">{current.name}</h2>
            <p className="mt-1 text-sm text-paper-muted">{current.mood}</p>
          </div>
          <TypographySample theme={current} />
        </div>

        <AppMockup />
      </section>

      <div className="mt-10 grid gap-2 sm:grid-cols-2">
        <Link href="/feed" className="btn-brand py-3.5 text-center text-sm">
          Open feed as {current.name}
        </Link>
        <Link href="/login" className="btn-ghost py-3.5 text-center text-sm">
          Login screen
        </Link>
        <Link href="/create" className="btn-ghost py-3.5 text-center text-sm">
          Create poll
        </Link>
        <Link href="/" className="btn-ghost py-3.5 text-center text-sm">
          Landing page
        </Link>
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  selected,
  isDefault,
  onSelect,
}: {
  theme: ThemeMeta;
  selected: boolean;
  isDefault: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`panel overflow-hidden p-0 text-left transition-colors ${
        selected ? "border-brand ring-1 ring-brand/30" : "hover:border-line-strong"
      }`}
    >
      <div
        className="flex h-16 items-end gap-1 border-b border-line p-3"
        style={{ background: theme.palette.bg }}
      >
        {[theme.palette.surface, theme.palette.text, theme.accent].map((color) => (
          <span
            key={color}
            className="h-8 flex-1 border border-line/50"
            style={{ background: color }}
            aria-hidden
          />
        ))}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-lg font-semibold">{theme.name}</span>
          {isDefault && <span className="chip !py-0.5 !text-[9px]">Saved</span>}
          {selected && (
            <span className="chip !border-brand !py-0.5 !text-[9px] !text-brand">
              Active
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm leading-snug text-paper-muted">
          {theme.tagline}
        </p>
        <p className="mt-2 text-[11px] text-paper-faint">
          {theme.fonts.display} + {theme.fonts.body}
        </p>
      </div>
    </button>
  );
}

function TypographySample({ theme }: { theme: ThemeMeta }) {
  return (
    <div className="text-right">
      <p className="font-display text-5xl leading-none">Ag</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-paper-faint">
        {theme.fonts.display}
      </p>
      <p className="text-[10px] text-paper-faint">{theme.fonts.body}</p>
    </div>
  );
}

function AppMockup() {
  return (
    <div className="overflow-hidden border border-line bg-ink-soft shadow-[0_32px_80px_-32px_rgba(0,0,0,0.75)]">
      {/* Top bar */}
      <div className="top-bar flex items-center gap-2 px-3 py-2.5">
        <span className="flex items-center gap-1.5 border border-line bg-surface px-2 py-1">
          <LogoMark size={16} />
          <span className="text-[10px] font-semibold text-amber">3</span>
        </span>
        <div className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
          <span className="category-pill category-pill-active shrink-0 px-2 py-1">
            All
          </span>
          <span className="category-pill shrink-0 px-2 py-1 text-paper-muted">
            Fashion
          </span>
          <span className="category-pill shrink-0 px-2 py-1 text-paper-muted">
            Food
          </span>
        </div>
      </div>

      {/* Poll content */}
      <div className="relative px-4 pb-4 pt-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="chip">Style</span>
          <span className="text-[11px] text-paper-muted">@maya_k · 2h</span>
        </div>

        <h3 className="font-display max-w-[18rem] text-xl font-semibold leading-snug">
          Which outfit for the gallery opening?
        </h3>
        <p className="mt-1 text-[11px] text-paper-faint">847 votes</p>

        <div className="option-grid option-grid-3 mt-4 max-w-none">
          {[
            { label: "A", pct: 61, picked: true },
            { label: "B", pct: 24, picked: false },
            { label: "C", pct: 15, picked: false },
          ].map((opt) => (
            <div
              key={opt.label}
              className={`tile aspect-[3/4] ${opt.picked ? "tile-picked" : ""}`}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: opt.picked
                    ? "linear-gradient(160deg, var(--color-surface-2), var(--color-ink-raised))"
                    : "linear-gradient(160deg, var(--color-ink-raised), var(--color-surface))",
                }}
              />
              <div className="scrim-bottom absolute inset-x-0 bottom-0 h-2/5" />
              {!opt.picked && (
                <span className="badge-letter absolute left-2 top-2">
                  {opt.label}
                </span>
              )}
              {opt.picked && (
                <span className="badge-letter badge-picked absolute left-2 top-2">
                  ✓
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p
                  className={`text-2xl font-bold tabular-nums leading-none ${opt.picked ? "text-brand" : ""}`}
                >
                  {opt.pct}
                  <span className="text-sm font-semibold">%</span>
                </p>
                <div className="mt-1.5 h-1 bg-paper/15">
                  <div
                    className={`h-full ${opt.picked ? "bar-accent" : "bar-muted"}`}
                    style={{ width: `${opt.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="anim-rise truncate border border-line bg-surface px-3 py-1.5 text-xs font-medium">
            You&apos;re with <span className="font-semibold text-brand">61%</span>{" "}
            of voters
          </span>
          <span className="btn-ghost ml-auto px-3 py-1.5 text-[11px]">Share</span>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-line bg-ink p-2">
        <div className="nav-bar flex items-stretch gap-0.5 p-1">
          <span className="nav-tab-active flex flex-1 flex-col items-center py-2 text-[9px] font-semibold">
            Feed
          </span>
          <span className="btn-brand mx-0.5 flex flex-1 flex-row items-center justify-center gap-1 py-2 text-[10px]">
            + Create
          </span>
          <span className="flex flex-1 flex-col items-center py-2 text-[9px] font-semibold text-paper-faint">
            You
          </span>
        </div>
      </div>
    </div>
  );
}
