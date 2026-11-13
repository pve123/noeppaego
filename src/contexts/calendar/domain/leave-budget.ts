import { BreakOption, LongBreak } from "./long-break";

type LeavePick = { readonly longBreak: LongBreak; readonly option: BreakOption };

/** 고른 방법들을 날짜로 펼친 합 — 연휴끼리 겹치는 날(2027.05.05 처럼 두 연휴에 걸친 공휴일)은 한 번만 센다 */
type Plan = {
  readonly picks: readonly LeavePick[];
  readonly days: ReadonlySet<string>;
  readonly leaveDays: ReadonlySet<string>;
};

const EMPTY: Plan = { picks: [], days: new Set(), leaveDays: new Set() };

/** 더 오래 쉬면 낫고, 같으면 연차를 덜 쓰는 쪽 */
const isBetter = (a: Plan, b: Plan | undefined) =>
  !b || a.days.size > b.days.size || (a.days.size === b.days.size && a.leaveDays.size < b.leaveDays.size);

function add(plan: Plan, pick: LeavePick): Plan {
  const days = new Set(plan.days);
  for (const d of pick.option.dates()) days.add(d.iso);
  const leaveDays = new Set(plan.leaveDays);
  for (const d of pick.option.leaveDays) leaveDays.add(d.iso);
  return { picks: [...plan.picks, pick], days, leaveDays };
}

/** 고른 방법들로 실제로 쉬는 날과 쓰는 연차 — 겹치는 날은 한 번만 센다 */
export function leavePlanTotals(picks: readonly LeavePick[]): { days: number; leave: number } {
  const plan = picks.reduce(add, EMPTY);
  return { days: plan.days.size, leave: plan.leaveDays.size };
}

/**
 * 남은 연차로 가장 오래 쉬는 방법(도메인 서비스, 순수 함수).
 * 연휴마다 쉬는 방법을 하나 고르거나 건너뛰어, 쓴 연차가 budget 을 넘지 않으면서 쉬는 날 합이 가장 크게 고른다.
 * 같은 날수면 연차를 덜 쓰는 쪽 — 남은 연차는 다른 데 쓸 수 있다.
 *
 * 연휴 열몇 개 × 연차 수십 개라 표(배낭 문제)로 바로 푼다.
 * 이웃한 연휴의 방법은 날짜가 겹칠 수 있어서(노동절 05.01~05.05 와 어린이날 05.05~05.09) 날짜로 펼쳐 더하고,
 * 겹침은 바로 앞에 고른 방법과 생기니 표를 「마지막으로 고른 방법」별로 나눠 둔다.
 */
export function bestLeavePlan(breaks: readonly LongBreak[], budget: number): LeavePick[] {
  const size = Math.max(0, budget) + 1;
  // tables.get(last)[b] — 마지막으로 last 를 골랐고 연차를 b 개 쓴 가장 좋은 계획
  let tables = new Map<BreakOption | undefined, (Plan | undefined)[]>([[undefined, [EMPTY, ...Array(size - 1).fill(undefined)]]]);

  for (const longBreak of breaks) {
    const next = new Map([...tables].map(([last, plans]) => [last, [...plans]])); // 이 연휴는 건너뛴다
    for (const plans of tables.values()) {
      for (const before of plans) {
        if (!before) continue;
        for (const option of longBreak.options) {
          const plan = add(before, { longBreak, option });
          const used = plan.leaveDays.size;
          if (used >= size) continue;
          const row = next.get(option) ?? Array<Plan | undefined>(size).fill(undefined);
          if (isBetter(plan, row[used])) row[used] = plan;
          next.set(option, row);
        }
      }
    }
    tables = next;
  }

  let best: Plan = EMPTY;
  for (const plans of tables.values()) {
    for (const plan of plans) if (plan && isBetter(plan, best)) best = plan;
  }
  return [...best.picks];
}
