"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import { FlameIcon } from "@/components/ui/icons";
import {
  signOutAction,
  updateAvatarUrl,
  updateUsername,
} from "@/lib/polls/actions";
import { uploadAvatarImage } from "@/lib/upload/client-upload";
import type { UserStats } from "@/types/poll";

type ProfileHeaderProps = {
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  stats: UserStats;
};

export function ProfileHeader({
  username,
  email,
  avatarUrl: initialAvatarUrl,
  stats,
}: ProfileHeaderProps) {
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(!username);
  const [value, setValue] = useState(username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [liveStats, setLiveStats] = useState(stats);
  const [isPending, startTransition] = useTransition();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    setLiveStats(stats);
  }, [stats]);

  useEffect(() => {
    const onVoted = () => {
      setLiveStats((current) => ({
        ...current,
        votesCast: current.votesCast + 1,
        votesToday: current.votesToday + 1,
      }));
    };

    window.addEventListener("feedbacker:voted", onVoted);
    return () => window.removeEventListener("feedbacker:voted", onVoted);
  }, []);

  const save = () => {
    startTransition(async () => {
      const result = await updateUsername(value);
      if (!result.ok) {
        notify(result.error ?? "Could not save", "error");
        return;
      }
      notify("Username saved", "success");
      setEditing(false);
    });
  };

  const handleAvatarPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const uploaded = await uploadAvatarImage(file);
      if ("error" in uploaded) {
        notify(uploaded.error, "error");
        return;
      }

      const saved = await updateAvatarUrl(uploaded.url);
      if (!saved.ok) {
        notify(saved.error ?? "Could not save profile photo", "error");
        return;
      }

      setAvatarUrl(uploaded.url);
      notify("Profile photo updated", "success");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <section className="panel p-6">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploadingAvatar}
            className="group relative block rounded-full disabled:opacity-60"
            aria-label="Change profile photo"
          >
            <UserAvatar
              username={username}
              avatarUrl={avatarUrl}
              email={email}
              size={56}
            />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-ink/55 text-[10px] font-semibold uppercase tracking-wide text-paper opacity-0 transition-opacity group-hover:opacity-100">
              {isUploadingAvatar ? "…" : "Change"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="sr-only"
            onChange={handleAvatarPick}
          />
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex gap-2">
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="username"
                autoFocus
                className="field !py-2 text-sm"
              />
              <button
                type="button"
                onClick={save}
                disabled={isPending}
                className="btn-brand shrink-0 px-4 py-2 text-xs"
              >
                {isPending ? "…" : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-xl font-semibold tracking-tight">
                @{username}
              </h1>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[11px] font-semibold text-paper-faint transition-colors hover:text-paper"
              >
                edit
              </button>
            </div>
          )}

          {email && (
            <p className="mt-1 truncate text-xs text-paper-faint">{email}</p>
          )}

          {liveStats.currentStreak > 0 && (
            <span className="chip mt-2.5 border-amber/30 bg-amber/12 text-amber">
              <FlameIcon className="h-3.5 w-3.5" />
              {liveStats.currentStreak}-day streak
            </span>
          )}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-2.5">
        <StatBox label="Polls" value={liveStats.pollsCreated} />
        <StatBox label="Votes cast" value={liveStats.votesCast} />
        <StatBox label="Today" value={liveStats.votesToday} accent />
      </dl>

      <form action={signOutAction} className="mt-4">
        <button
          type="submit"
          className="w-full text-xs font-medium text-white/30 transition-colors hover:text-red-300"
        >
          Log out
        </button>
      </form>
    </section>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-3.5 text-center">
      <dt
        className={`font-display text-2xl font-semibold tabular-nums ${accent ? "text-brand" : ""}`}
      >
        {value}
      </dt>
      <dd className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-paper-faint">
        {label}
      </dd>
    </div>
  );
}
