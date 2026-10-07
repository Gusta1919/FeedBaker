type IconProps = { className?: string };

const base = "h-[22px] w-[22px]";

export function FeedIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      className={`${base} ${className ?? ""}`}
    >
      <rect x="3" y="3" width="7.5" height="18" rx="2.5" />
      <rect x="13.5" y="3" width="7.5" height="18" rx="2.5" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={`${base} ${className ?? ""}`}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      className={`${base} ${className ?? ""}`}
    >
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4S18.1 16.4 19.5 20" />
    </svg>
  );
}

export function PollsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${base} ${className ?? ""}`}
    >
      <rect x="4" y="4" width="7" height="9" rx="1.75" />
      <rect x="13" y="4" width="7" height="9" rx="1.75" />
      <rect x="4" y="15" width="7" height="5" rx="1.75" />
      <rect x="13" y="15" width="7" height="5" rx="1.75" />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${base} ${className ?? ""}`}
    >
      <path d="M12 16V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
    </svg>
  );
}

export function SkipIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${base} ${className ?? ""}`}
    >
      <path d="M5 6l8 6-8 6V6z" />
      <path d="M18 5v14" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      className={`${base} ${className ?? ""}`}
    >
      <path d="M5 20V11M12 20V5M19 20v-6" />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${base} ${className ?? ""}`}
    >
      <path d="M12.8 2.2c.3 2.4-.7 3.6-1.9 4.8-1.3 1.3-2.8 2.8-2.8 5.4a5.9 5.9 0 0 0 11.8 0c0-3.4-2-5.2-3.6-6.7-1.4-1.3-2.6-2.4-3.5-3.5zM8.4 13.9c.2 1.5-.5 2.2-1.1 2.9-.7.7-1.5 1.5-1.5 3a3.2 3.2 0 0 0 6.4 0c0-1.9-1.1-2.9-2-3.7-.8-.7-1.4-1.3-1.8-2.2z" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${base} ${className ?? ""}`}
    >
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function ArrowDownIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${base} ${className ?? ""}`}
    >
      <path d="M12 5v14M5.5 12.5L12 19l6.5-6.5" />
    </svg>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${base} ${className ?? ""}`}
    >
      <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      className={`${base} ${className ?? ""}`}
    >
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      className={`${base} ${className ?? ""}`}
    >
      <rect x="4" y="4" width="7" height="7" rx="1.2" />
      <rect x="13" y="4" width="7" height="7" rx="1.2" />
      <rect x="4" y="13" width="7" height="7" rx="1.2" />
      <rect x="13" y="13" width="7" height="7" rx="1.2" />
    </svg>
  );
}

export function CarouselIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      className={`${base} ${className ?? ""}`}
    >
      <rect x="6" y="5" width="12" height="14" rx="1.5" />
      <path d="M4 12h1.5M18.5 12H20" opacity="0.55" />
    </svg>
  );
}
