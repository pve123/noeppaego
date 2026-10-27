import { LoadingStatus } from "./loading-status";

/**
 * 실제 화면을 닮은 불러오는 자리 — 같은 자리에 같은 크기로 그려 내용이 들어올 때 화면이 흔들리지 않게 한다.
 * 맨 위에는 지금 하는 일을 알려 준다(LoadingStatus).
 */

const Bar = ({ className = "" }: { className?: string }) => <div aria-hidden className={`shimmer rounded-lg ${className}`} />;
const DarkBar = ({ className = "" }: { className?: string }) => <div aria-hidden className={`shimmer-dark rounded-lg ${className}`} />;

/** 잉크색 띠(첫 화면 다음 연휴·상세 머리) */
export function BandSkeleton({ steps, tall = false }: { steps: string[]; tall?: boolean }) {
  return (
    <div className="mt-4 bg-ink">
      <div className={`mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:px-6 ${tall ? "items-center py-16" : "py-8 sm:py-10"}`}>
        <LoadingStatus steps={steps} tone="dark" />
        <DarkBar className="h-5 w-40" />
        <DarkBar className="h-10 w-72 max-w-full" />
        {tall && <DarkBar className="h-20 w-36" />}
        <DarkBar className="h-4 w-60" />
        {tall && (
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <DarkBar key={i} className="h-16 w-12 rounded-xl" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** 연휴 카드 한 장 */
function BreakCardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-3xl border-[3px] border-ink/10 bg-surface">
      <div className="shimmer h-[66px]" />
      <div className="space-y-2.5 p-5">
        <Bar className="h-11 w-24" />
        <Bar className="h-4 w-56" />
        <Bar className="h-4 w-28" />
        <div className="flex gap-1.5 pt-1">
          {[0, 1, 2].map((i) => (
            <Bar key={i} className="h-12 w-9 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BreaksSkeleton() {
  return (
    <div aria-busy="true" aria-label="연휴를 불러오는 중">
      <BandSkeleton tall steps={["공휴일을 불러오는 중", "주말과 공휴일을 잇는 중", "연차로 늘릴 방법을 찾는 중"]} />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Bar className="h-11 w-48 rounded-2xl" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <BreakCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** 갈 곳 카드 */
export function DestinationsSkeleton() {
  return (
    <div aria-busy="true" aria-label="갈 곳을 찾는 중" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <LoadingStatus steps={["이 연휴에 열리는 축제를 찾는 중", "출발지에서 거리를 재는 중"]} />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} aria-hidden className="overflow-hidden rounded-3xl border-[3px] border-ink/10 bg-surface">
            <div className="shimmer h-[58px]" />
            <div className="shimmer aspect-[16/9] opacity-70" />
            <div className="space-y-2.5 p-5">
              <Bar className="h-4 w-64 max-w-full" />
              <Bar className="h-3.5 w-40" />
              <Bar className="h-4 w-56 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 일정 한 칸 */
function SlotSkeleton({ withImage }: { withImage: boolean }) {
  return (
    <div aria-hidden className="flex gap-3 rounded-2xl border-[2.5px] border-ink/10 bg-surface p-4">
      <Bar className="h-5 w-10" />
      {withImage && <Bar className="size-24 shrink-0 rounded-xl sm:size-32" />}
      <div className="flex-1 space-y-2">
        <Bar className="h-5 w-48 max-w-full" />
        <Bar className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function ItinerarySkeleton() {
  return (
    <div aria-busy="true" aria-label="일정을 짜는 중">
      <BandSkeleton steps={["관광지를 고르는 중", "근처 식당을 찾는 중", "날씨를 확인하는 중", "이동 시간을 계산하는 중"]} />
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-10 sm:px-6">
        <Bar className="h-28 rounded-3xl" />
        <Bar className="mt-6 h-10 w-44 rounded-2xl" />
        {[false, true, false, true].map((img, i) => (
          <SlotSkeleton key={i} withImage={img} />
        ))}
      </div>
    </div>
  );
}

/** 찜 목록 */
export function FavoritesSkeleton() {
  return (
    <div aria-busy="true" aria-label="찜한 일정을 불러오는 중">
      <LoadingStatus steps={["찜한 일정을 불러오는 중"]} />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} aria-hidden className="overflow-hidden rounded-3xl border-[3px] border-ink/10 bg-surface">
            <div className="shimmer h-[72px]" />
            <div className="space-y-2 p-5">
              <Bar className="h-4 w-56" />
              <Bar className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
