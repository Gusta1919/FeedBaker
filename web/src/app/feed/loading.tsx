export default function FeedLoading() {
  return (
    <main className="app-shell">
      <div className="flex h-dvh flex-col px-3 pb-32 pt-[9.5rem]">
        <div className="absolute inset-x-0 top-0 px-5 pt-14">
          <div className="skeleton mb-3 h-6 w-24 rounded-full" />
          <div className="skeleton mb-2 h-7 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-20 rounded-md" />
        </div>
        <div className="grid h-full max-h-[34rem] grid-cols-2 gap-2.5">
          <div className="skeleton rounded-[20px]" />
          <div className="skeleton rounded-[20px]" />
        </div>
      </div>
    </main>
  );
}
