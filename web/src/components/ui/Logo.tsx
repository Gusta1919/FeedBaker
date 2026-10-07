import Link from "next/link";

type LogoProps = {
  href?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZES = {
  sm: { mark: 22, word: "text-sm" },
  md: { mark: 28, word: "text-base" },
  lg: { mark: 36, word: "text-xl" },
  xl: { mark: 44, word: "text-2xl" },
} as const;

/** Stacked feed cards with an active pick — scroll, compare, vote. */
export function LogoMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden
      className={`shrink-0 text-brand ${className}`}
    >
      <rect
        x="7"
        y="4"
        width="26"
        height="32"
        rx="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.28"
      />
      <rect
        x="10"
        y="7"
        width="20"
        height="6.5"
        rx="2"
        fill="currentColor"
        opacity="0.18"
      />
      <rect x="10" y="15.5" width="20" height="9" rx="2.5" fill="currentColor" />
      <path
        d="M14.25 19.75l2.1 2.1 4.4-4.55"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.82"
      />
      <rect
        x="10"
        y="27"
        width="20"
        height="6.5"
        rx="2"
        fill="currentColor"
        opacity="0.18"
      />
      <circle cx="34.5" cy="13.5" r="1.2" fill="currentColor" opacity="0.22" />
      <circle cx="34.5" cy="20" r="1.35" fill="currentColor" />
      <circle cx="34.5" cy="26.5" r="1.2" fill="currentColor" opacity="0.22" />
    </svg>
  );
}

export function LogoWordmark({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: keyof typeof SIZES;
}) {
  const { word } = SIZES[size];

  return (
    <span
      className={`font-display font-semibold tracking-[-0.045em] ${word} ${className}`}
    >
      <span className="text-paper">Feed</span>
      <span className="text-brand">Baker</span>
    </span>
  );
}

export function Logo({
  href = "/",
  showWordmark = true,
  size = "md",
  className = "",
}: LogoProps) {
  const { mark } = SIZES[size];

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={mark} />
      {showWordmark && <LogoWordmark size={size} />}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-opacity hover:opacity-85">
        {content}
      </Link>
    );
  }

  return content;
}

/** Desktop sidebar — horizontal mark + wordmark like TikTok. */
export function LogoBrand({ href = "/feed" }: { href?: string }) {
  return (
    <Link href={href} className="desktop-rail-brand" aria-label="FeedBaker home">
      <LogoMark size={48} />
      <LogoWordmark size="xl" className="desktop-rail-wordmark" />
    </Link>
  );
}
