import Link from "next/link";
import type { ReachPreference } from "@/contexts/destination";

const LABELS: Record<ReachPreference, string> = {
  near: "가까운 곳만",
  auto: "연휴 길이에 맞게",
  far: "멀어도 괜찮아요",
};
const ORDER: ReachPreference[] = ["near", "auto", "far"];

/** 거리 주소 조각 — 기본(auto)은 주소에 남기지 않는다 */
export const reachQuery = (reach: ReachPreference) => (reach === "auto" ? "" : `&reach=${reach}`);

/** 얼마나 멀리 갈까요 — 기본은 연휴 길이대로, 좁히거나 넓힐 수 있다. 링크라 자바스크립트 없이도 된다 */
export function ReachChips({ basePath, originId, selected }: { basePath: string; originId: string; selected: ReachPreference }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span id="reach-label" className="font-bold">
        얼마나 멀리 갈까요?
      </span>
      <nav aria-labelledby="reach-label" className="flex flex-wrap gap-2">
        {ORDER.map((reach) => {
          const active = reach === selected;
          return (
            <Link
              key={reach}
              href={`${basePath}?from=${originId}${reachQuery(reach)}`}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={`inline-flex h-10 items-center rounded-full border-[2.5px] border-ink px-4 font-display text-[16px] transition-transform ${
                active ? "-rotate-2 bg-yellow shadow-pop-sm" : "bg-surface hover:-translate-y-0.5"
              }`}
            >
              {LABELS[reach]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** 결과가 비었을 때 한 단계 넓히기 — 가까운 곳만 → 연휴 길이대로 → 멀어도 괜찮아요 */
export const widerThan = (reach: ReachPreference): ReachPreference | undefined =>
  reach === "near" ? "auto" : reach === "auto" ? "far" : undefined;
export const reachLabel = (reach: ReachPreference) => LABELS[reach];
