type VibeMarkProps = {
  mark: "crowd" | "mainstream" | "balanced" | "wildcard" | "contrarian";
  className?: string;
};

export function VibeMark({ mark, className = "" }: VibeMarkProps) {
  return (
    <span
      className={`inline-grid h-9 w-9 shrink-0 place-items-center border border-line bg-surface ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand" fill="currentColor">
        {mark === "crowd" && (
          <>
            <circle cx="8" cy="12" r="2.2" opacity="0.45" />
            <circle cx="12" cy="12" r="2.2" opacity="0.7" />
            <circle cx="16" cy="12" r="2.2" />
          </>
        )}
        {mark === "mainstream" && (
          <>
            <rect x="5" y="10" width="14" height="1.6" rx="0.8" opacity="0.45" />
            <rect x="7" y="13" width="10" height="1.6" rx="0.8" opacity="0.7" />
            <rect x="9" y="16" width="6" height="1.6" rx="0.8" />
          </>
        )}
        {mark === "balanced" && (
          <>
            <rect x="5" y="5" width="6.5" height="14" rx="1" opacity="0.45" />
            <rect x="12.5" y="5" width="6.5" height="14" rx="1" />
          </>
        )}
        {mark === "wildcard" && (
          <>
            <circle cx="8.5" cy="8.5" r="2" opacity="0.55" />
            <circle cx="16" cy="10" r="2" opacity="0.75" />
            <circle cx="11" cy="16" r="2" />
          </>
        )}
        {mark === "contrarian" && (
          <>
            <circle cx="16.5" cy="7.5" r="2.4" />
            <rect x="5" y="14" width="10" height="1.6" rx="0.8" opacity="0.35" />
            <rect x="7" y="17" width="6" height="1.6" rx="0.8" opacity="0.55" />
          </>
        )}
      </svg>
    </span>
  );
}

export function CategoryInitial({
  category,
  className = "",
}: {
  category: string;
  className?: string;
}) {
  const initials = category
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={`inline-grid h-8 w-8 shrink-0 place-items-center border border-line bg-ink-soft font-display text-[10px] font-semibold tracking-wide text-paper-muted ${className}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function AccentBar({
  tone = "brand",
}: {
  tone?: "brand" | "muted";
}) {
  return (
    <span
      className={`inline-block h-4 w-0.5 shrink-0 rounded-full ${
        tone === "brand" ? "bg-brand" : "bg-paper-faint/50"
      }`}
      aria-hidden
    />
  );
}

export function ChipMarker({ tone }: { tone: "contrarian" | "classic" }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
        tone === "contrarian" ? "bg-brand" : "bg-paper-faint/60"
      }`}
      aria-hidden
    />
  );
}
