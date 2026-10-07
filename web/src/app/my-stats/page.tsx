import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { DesktopRail } from "@/components/layout/DesktopRail";
import { OriginalityMetrics } from "@/components/profile/OriginalityMetrics";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import {
  getCurrentProfile,
  getCurrentUser,
  getUserStats,
  getUserVoteInsights,
} from "@/lib/polls/queries";

export const dynamic = "force-dynamic";

export default async function MyStatsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/my-stats");

  const [profile, stats, insights] = await Promise.all([
    getCurrentProfile(),
    getUserStats(user.id),
    getUserVoteInsights(user.id),
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
          <header className="mb-6 lg:mb-8">
            <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] lg:text-4xl">
              My stats
            </h1>
            <p className="mt-1.5 text-sm text-paper-muted lg:mt-2 lg:text-base">
              Your scrolling activity, streaks, and taste profile.
            </p>
          </header>

          <ProfileHeader
            username={profile?.username ?? null}
            email={user.email ?? null}
            avatarUrl={profile?.avatarUrl ?? null}
            stats={stats}
          />

          <OriginalityMetrics initialInsights={insights} />
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
