"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PollCard } from "@/components/feed/PollCard";
import { useToast } from "@/components/ui/Toast";
import type { Poll } from "@/types/poll";

type SinglePollViewProps = {
  poll: Poll;
  isAuthenticated: boolean;
  justCreated: boolean;
  inviteCode: string | null;
};

export function SinglePollView({
  poll,
  isAuthenticated,
  justCreated,
  inviteCode,
}: SinglePollViewProps) {
  const { notify } = useToast();

  useEffect(() => {
    if (justCreated) notify("Your poll is live — share it", "success");
  }, [justCreated, notify]);

  return (
    <div className="relative">
      <Link
        href="/feed"
        className="btn-ghost fixed left-4 top-[max(1rem,env(safe-area-inset-top))] z-50 px-4 py-2 text-xs"
      >
        ← Feed
      </Link>

      <PollCard poll={poll} index={0} isAuthenticated={isAuthenticated} />

      {justCreated && inviteCode && (
        <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[min(24rem,calc(100%-2rem))] border border-line bg-surface p-4">
          <p className="text-xs text-paper-muted">Invite code</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-[0.2em] text-brand">
            {inviteCode}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(inviteCode);
              notify("Invite code copied", "success");
            }}
            className="btn-ghost mt-3 w-full py-2.5 text-xs"
          >
            Copy code
          </button>
        </div>
      )}
    </div>
  );
}
