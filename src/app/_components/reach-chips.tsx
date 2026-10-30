import Link from "next/link";
import type { ReachPreference } from "@/contexts/destination";

const LABELS: Record<ReachPreference, string> = {
  "2h": "차로 2시간",
  "4h": "차로 4시간",
  any: "어디든",
};
const ORDER: ReachPreference[] = ["2h", "4h", "any"];

/** 거리 주소 조각 — 연휴 길이에 맞는 값(recommended)은 주소에 남기지 않는다 */
export const reachQuery = (reach: ReachPreference, recommended: ReachPreference) => (reach === recommended ? "" : `&reach=${reach}`);

/** 얼마나 멀리 갈까요 — 처음엔 연휴 길이에 맞는 칩(「추천」)이 골라져 있다. 링크라 자바스크립트 없이도 된다 */
export function ReachChips({
  basePath,
  originId,
  selected,
  recommended,
}: {
  basePath: string;
  originId: string;
  selected: ReachPreference;
  recommended: ReachPreference;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* 출발지 줄과 컨트롤 시작점을 맞춘다(같은 라벨 폭) */}
      <span id="reach-label" className="w-full font-bold sm:w-40">
        얼마나 멀리 갈까요?
      </span>
      <nav aria-labelledby="reach-label" className="flex flex-wrap gap-2">
        {ORDER.map((reach) => {
          const active = reach === selected;
          return (
            <Link
              key={reach}
              href={`${basePath}?from=${originId}${reachQuery(reach, recommended)}`}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={`inline-flex h-10 items-center rounded-full border-[2.5px] border-ink px-4 font-display text-[16px] transition-transform ${
                active ? "bg-yellow" : "bg-surface hover:-translate-y-0.5"
              }`}
            >
              {LABELS[reach]}
              {reach === recommended && <span className="ml-1.5 text-[13px] text-ink/60">추천</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** 결과가 비었을 때 한 단계 넓히기 — 차로 2시간 → 차로 4시간 → 어디든 */
export const widerThan = (reach: ReachPreference): ReachPreference | undefined =>
  reach === "2h" ? "4h" : reach === "4h" ? "any" : undefined;
export const reachLabel = (reach: ReachPreference) => LABELS[reach];
