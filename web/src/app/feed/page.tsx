import { BottomNav } from "@/components/BottomNav";
import { FeedView } from "@/components/feed/FeedView";
import { getCurrentProfile, getCurrentUser, getFeed, getUserStats } from "@/lib/polls/queries";
import { isPollCategory } from "@/types/poll";

export const dynamic = "force-dynamic";

type FeedPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { category } = await searchParams;
  const activeCategory =
    category && isPollCategory(category) ? category : null;

  const user = await getCurrentUser();
  const [polls, stats, profile] = await Promise.all([
    getFeed({ category: activeCategory }),
    user ? getUserStats(user.id) : Promise.resolve(null),
    user ? getCurrentProfile() : Promise.resolve(null),
  ]);

  return (
    <main className="app-shell app-bg">
      <FeedView
        polls={polls}
        isAuthenticated={Boolean(user)}
        user={
          profile
            ? {
                username: profile.username,
                avatarUrl: profile.avatarUrl,
                email: user?.email ?? null,
              }
            : null
        }
        activeCategory={activeCategory}
        votesToday={stats?.votesToday ?? 0}
        streak={stats?.currentStreak ?? 0}
      />
      <BottomNav />
    </main>
  );
}
