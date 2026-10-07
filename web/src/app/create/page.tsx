import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { CreatePollForm } from "@/components/create/CreatePollForm";
import { DesktopRail } from "@/components/layout/DesktopRail";
import { getCurrentProfile, getCurrentUser } from "@/lib/polls/queries";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/create");

  const profile = await getCurrentProfile();

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
              New poll
            </h1>
            <p className="mt-1.5 text-sm text-paper-muted lg:mt-2 lg:text-base">
              Add 2–4 photos and let people pick. Results come in within minutes.
            </p>
          </header>

          <CreatePollForm />
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
