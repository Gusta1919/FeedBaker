"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { deletePoll } from "@/lib/polls/actions";

export function ShareStatsActions({ pollId }: { pollId: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const share = async () => {
    const url = `${window.location.origin}/p/${pollId}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify("Link copied", "success");
    } catch {
      notify("Could not copy the link", "error");
    }
  };

  const remove = () => {
    startTransition(async () => {
      const result = await deletePoll(pollId);
      if (!result.ok) {
        notify(result.error ?? "Could not delete", "error");
        return;
      }
      notify("Poll deleted", "success");
      router.push("/my-polls");
    });
  };

  return (
    <div className="mt-6 space-y-2.5">
      <button type="button" onClick={share} className="btn-brand w-full py-3.5 text-sm">
        Share this poll
      </button>

      {confirming ? (
        <div className="anim-rise flex gap-2.5">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="btn-ghost flex-1 py-3 text-sm"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="flex-1 rounded-full bg-red-500/85 py-3 text-sm font-semibold transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {isPending ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full py-2 text-xs font-medium text-white/30 transition-colors hover:text-red-300"
        >
          Delete poll
        </button>
      )}
    </div>
  );
}
