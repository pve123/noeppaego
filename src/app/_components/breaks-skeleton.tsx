import { Shimmer } from "./reveal";

export function BreaksSkeleton() {
  return (
    <div aria-busy="true" aria-label="연휴를 불러오는 중">
      <div className="shimmer-dark h-80" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Shimmer className="h-11 w-60 rounded-2xl" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Shimmer key={i} className="h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}
