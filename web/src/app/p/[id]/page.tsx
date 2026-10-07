import Link from "next/link";
import type { Metadata } from "next";
import { SinglePollView } from "@/components/SinglePollView";
import { getCurrentUser, getPollById } from "@/lib/polls/queries";

export const dynamic = "force-dynamic";

type PollPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export async function generateMetadata({
  params,
}: PollPageProps): Promise<Metadata> {
  const { id } = await params;
  const poll = await getPollById(id);

  if (!poll) return { title: "Poll not found — FeedBaker" };

  return {
    title: `${poll.question} — FeedBaker`,
    description: `Vote on this poll by @${poll.creatorUsername}.`,
  };
}

export default async function PollPage({
  params,
  searchParams,
}: PollPageProps) {
  const { id } = await params;
  const { created } = await searchParams;

  const [poll, user] = await Promise.all([getPollById(id), getCurrentUser()]);

  if (!poll) {
    return (
      <main className="app-shell app-bg grid min-h-dvh place-items-center px-8 text-center">
        <div className="relative z-10">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-surface text-2xl">
            🔍
          </div>
          <h1 className="text-xl font-bold tracking-tight">Poll not found</h1>
          <p className="mt-2 max-w-xs text-sm text-white/45">
            It may have been deleted, or it&apos;s private and you don&apos;t
            have access.
          </p>
          <Link href="/feed" className="btn-brand mt-6 inline-block px-7 py-3 text-sm">
            Go to the feed
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <SinglePollView
        poll={poll}
        isAuthenticated={Boolean(user)}
        justCreated={created === "1"}
        inviteCode={poll.isOwner ? poll.inviteCode : null}
      />
    </main>
  );
}
