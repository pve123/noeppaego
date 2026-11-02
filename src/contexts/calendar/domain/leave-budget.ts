import { BreakOption, LongBreak } from "./long-break";

export type LeavePick = { readonly longBreak: LongBreak; readonly option: BreakOption };

type Plan = { readonly days: number; readonly leave: number; readonly picks: readonly LeavePick[] };

const EMPTY: Plan = { days: 0, leave: 0, picks: [] };

/** 더 오래 쉬면 낫고, 같으면 연차를 덜 쓰는 쪽 */
const isBetter = (a: Plan, b: Plan) => a.days > b.days || (a.days === b.days && a.leave < b.leave);

/**
 * 남은 연차로 가장 오래 쉬는 방법(도메인 서비스, 순수 함수).
 * 연휴마다 쉬는 방법을 하나 고르거나 건너뛰어, 쓴 연차가 budget 을 넘지 않으면서 쉬는 날 합이 가장 크게 고른다.
 * 같은 날수면 연차를 덜 쓰는 쪽 — 남은 연차는 다른 데 쓸 수 있다.
 * 연휴 열몇 개 × 연차 수십 개라 표(배낭 문제)로 바로 푼다.
 */
export function bestLeavePlan(breaks: readonly LongBreak[], budget: number): LeavePick[] {
  // best[b] — 지금까지 본 연휴로, 연차를 b 개 이하 써서 낼 수 있는 가장 좋은 계획
  let best: Plan[] = Array.from({ length: Math.max(0, budget) + 1 }, () => EMPTY);
  for (const longBreak of breaks) {
    const next = [...best]; // 이 연휴는 건너뛴다
    for (let b = 0; b < best.length; b++) {
      for (const option of longBreak.options) {
        if (option.leaveCount > b) continue;
        const before = best[b - option.leaveCount];
        const plan = {
          days: before.days + option.length,
          leave: before.leave + option.leaveCount,
          picks: [...before.picks, { longBreak, option }],
        };
        if (isBetter(plan, next[b])) next[b] = plan;
      }
    }
    best = next;
  }
  return [...best.at(-1)!.picks];
}
