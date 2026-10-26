export function BreaksSkeleton() {
  return (
    <div aria-busy="true" aria-label="연휴를 불러오는 중">
      <div className="h-80 animate-pulse bg-ink/90" />
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-20 sm:px-6">
        <div className="h-12 w-72 rounded-2xl bg-soft-ink" />
        <div className="mt-6 flex gap-2.5">
          <div className="h-12 w-24 rounded-full bg-soft-ink" />
          <div className="h-12 w-24 rounded-full bg-soft-ink" />
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-soft-ink" />
          ))}
        </div>
      </div>
    </div>
  );
}
