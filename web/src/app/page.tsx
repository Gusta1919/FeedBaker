import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { getCurrentUser, getPreviewPolls } from "@/lib/polls/queries";
import { formatCount, getPercent } from "@/lib/polls/utils";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/feed");

  const previews = await getPreviewPolls(2);
  const hero = previews[0];

  return (
    <main className="app-shell app-bg overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between border-b border-line pb-6">
          <Logo href="/" size="md" />
          <Link href="/login" className="btn-ghost px-5 py-2 text-sm">
            Log in
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="chip mb-6">Visual polls</span>

            <h1 className="font-display text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[3.25rem]">
              Can&apos;t decide?
              <br />
              <span className="text-accent-line">Let people pick.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-paper-muted sm:text-[1.05rem]">
              FeedBaker is a scrolling feed of visual choices. Post two to four
              photos, get real votes fast — and help other people decide while
              you scroll.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="btn-brand px-8 py-3.5 text-center text-sm"
              >
                Start voting
              </Link>
              <Link
                href="/login?redirect=/create"
                className="btn-ghost px-8 py-3.5 text-center text-sm"
              >
                Post a poll
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-8">
              {[
                { value: "2–4", label: "photos per poll" },
                { value: "1 tap", label: "to vote" },
                { value: "You", label: "control privacy" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl font-semibold tracking-tight text-paper">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-[11px] font-medium leading-tight text-paper-faint">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-[19rem]">
            <PhonePreview poll={hero} />
          </div>
        </div>

        <section className="grid gap-3 border-t border-line pb-6 pt-10 sm:grid-cols-3">
          {[
            {
              title: "Made for photos",
              copy: "Outfits, profile pics, logos, paint colours — anything visual.",
            },
            {
              title: "Your privacy rules",
              copy: "Public feed, link-only, or invite-only. Hide results if you want.",
            },
            {
              title: "Built to be fast",
              copy: "Tap, see the split, scroll on. No comment threads, no drama.",
            },
          ].map((feature) => (
            <div key={feature.title} className="panel p-5">
              <h3 className="font-display text-sm font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-paper-muted">
                {feature.copy}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function PhonePreview({
  poll,
}: {
  poll: Awaited<ReturnType<typeof getPreviewPolls>>[number] | undefined;
}) {
  const options = poll?.options.slice(0, 2) ?? [];
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);

  return (
    <div className="rounded-lg border border-line-strong bg-ink-soft p-2 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)]">
      <div className="relative aspect-[9/17] overflow-hidden rounded-md bg-ink">
        {options.length === 2 ? (
          <>
            <div className="absolute inset-0 grid grid-cols-2 gap-1.5 p-3 pt-20 pb-16">
              {options.map((option, index) => {
                const percent = getPercent(option.voteCount, total);
                const leading =
                  option.voteCount >= Math.max(...options.map((o) => o.voteCount));

                return (
                  <div
                    key={option.id}
                    className={`tile ${leading ? "tile-picked" : ""}`}
                  >
                    <PhotoFrame
                      src={option.imageUrl}
                      alt={option.label || `Option ${index + 1}`}
                      priority
                    />
                    <div className="scrim-bottom absolute inset-x-0 bottom-0 h-1/2" />
                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                      <p
                        className={`text-lg font-bold leading-none ${leading ? "text-brand" : "text-white"}`}
                      >
                        {percent}%
                      </p>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/25">
                        <div
                          className={`h-full rounded-full ${leading ? "bg-brand" : "bg-white/70"}`}
                          style={{ width: `${Math.max(percent, 3)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="scrim-top absolute inset-x-0 top-0 h-28" />
            <div className="absolute inset-x-0 top-0 p-4 pt-7">
              <span className="chip mb-2 text-[10px]">
                {poll?.category ?? "Social"}
              </span>
              <p className="text-sm font-bold leading-snug">
                {poll?.question ?? "Which photo should I post?"}
              </p>
              <p className="mt-1 text-[10px] text-white/40">
                {formatCount(total)} votes
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex justify-center pb-5">
              <div className="rounded-md border border-line bg-surface px-3 py-1.5 text-[11px] font-medium">
                You&apos;re with{" "}
                <span className="font-semibold text-brand">
                  {getPercent(
                    Math.max(...options.map((o) => o.voteCount), 0),
                    total,
                  )}
                  %
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <p className="text-sm text-white/40">
              Your feed of visual choices starts here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
