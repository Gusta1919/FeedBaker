import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { DesktopRail } from "@/components/layout/DesktopRail";
import { PollTile } from "@/components/profile/PollTile";
import { PlusIcon } from "@/components/ui/icons";
import { getCurrentProfile, getCurrentUser, getPollsByCreator } from "@/lib/polls/queries";

export const dynamic = "force-dynamic";

export default async function MyPollsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/my-polls");

  const [profile, myPolls] = await Promise.all([
    getCurrentProfile(),
    getPollsByCreator(user.id),
  ]);

  return (
    <main className="app-shell app-bg app-page-layout">
      <DesktopRail
        isAuthenticated
        user={
          profile
            ? {
                username: profile.username,
                avatarUrl: profile.avatarUrl,
                email: user.email ?? null,
              }
            : null
        }
      />
      <div className="app-page-content">
        <div className="app-page-inner">
          <header className="mb-6 flex items-start justify-between gap-4 lg:mb-8">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] lg:text-4xl">
                My polls
              </h1>
              <p className="mt-1.5 text-sm text-paper-muted lg:mt-2 lg:text-base">
                Every poll you&apos;ve created, with live vote counts.
              </p>
            </div>
            <Link
              href="/create"
              className="btn-brand inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              New poll
            </Link>
          </header>

          <div className="space-y-3">
            {myPolls.length === 0 ? (
              <div className="panel-flat p-8 text-center">
                <p className="text-sm font-semibold">No polls yet</p>
                <p className="mt-1.5 text-xs leading-relaxed text-paper-muted">
                  Upload 2–4 photos and get opinions in minutes.
                </p>
                <Link
                  href="/create"
                  className="btn-brand mt-5 inline-flex items-center gap-2 px-6 py-3 text-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create your first poll
                </Link>
              </div>
            ) : (
              myPolls.map((poll) => (
                <PollTile key={poll.id} poll={poll} showOwnerMeta />
              ))
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
