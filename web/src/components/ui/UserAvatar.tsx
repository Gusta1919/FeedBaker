type UserAvatarProps = {
  username?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
};

export function UserAvatar({
  username,
  avatarUrl,
  email,
  size = 40,
  className = "",
}: UserAvatarProps) {
  const initial = (username ?? email ?? "?").charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full border border-line bg-surface font-semibold text-paper ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initial}
    </div>
  );
}

export function displayUsername(
  username: string | null | undefined,
  email?: string | null,
): string {
  if (username) return `@${username}`;
  const local = email?.split("@")[0];
  return local ? `@${local}` : "Profile";
}
