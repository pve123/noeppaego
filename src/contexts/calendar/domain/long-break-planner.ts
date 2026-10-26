import { CalendarDate } from "./calendar-date";
import { HolidayCalendar } from "./holiday-calendar";
import { BreakOption, LongBreak } from "./long-break";

export type PlanRule = {
  /** 연휴 하나에 쓸 수 있는 연차 */
  readonly maxLeave: number;
  readonly minLength: number;
  readonly maxLength: number;
  /** 같은 연차·같은 길이로 쉬는 방법이 여럿이면 몇 개까지 보여 줄지 (예: 수요일 공휴일 → 월·화 또는 목·금) */
  readonly maxTies: number;
};

export const DEFAULT_PLAN_RULE: PlanRule = {
  maxLeave: 2,
  minLength: 3,
  maxLength: 16,
  maxTies: 2,
};

/**
 * 한 해 달력에서 연휴와 연차로 늘리는 방법을 찾는다(도메인 서비스, 순수 함수).
 *
 * 구간은 바로 앞날·다음날이 출근일인 것만 본다 — 그래야 「토요일 하루만 빼고 쉰다」 같은 잘린 구간이 섞이지 않는다.
 * 구간 안의 출근일(가장자리 포함)은 연차로 메운다.
 */
export function planLongBreaks(
  calendar: HolidayCalendar,
  rule: PlanRule = DEFAULT_PLAN_RULE,
): LongBreak[] {
  const groups = new Map<string, BreakOption[]>();

  // 1월 초 연휴가 전년 12월 말 주말에서 시작할 수 있어 일주일 앞에서부터 본다.
  for (let start = calendar.firstDay.plusDays(-7); !start.isAfter(calendar.lastDay); start = start.plusDays(1)) {
    if (calendar.isRestDay(start.plusDays(-1))) continue;

    const leaveDays: CalendarDate[] = [];
    let restDays = 0;
    let anchor: CalendarDate | undefined;

    for (let end = start, length = 1; length <= rule.maxLength; end = end.plusDays(1), length++) {
      if (calendar.isRestDay(end)) restDays++;
      else leaveDays.push(end);
      if (leaveDays.length > rule.maxLeave) break;
      if (!anchor && calendar.isWeekdayHolidayOfYear(end)) anchor = end;

      const closes = !calendar.isRestDay(end.plusDays(1));
      // 쉬는 날이 3일은 돼야 공휴일 덕을 본 연휴다 — 평범한 주말 + 연차는 뺀다.
      if (closes && anchor && length >= rule.minLength && restDays >= rule.minLength) {
        const options = groups.get(anchor.iso) ?? [];
        options.push(new BreakOption(start, end, [...leaveDays]));
        groups.set(anchor.iso, options);
      }
    }
  }

  return [...groups.values()]
    .map((options) => {
      const kept = keepWorthwhile(options, rule.maxTies);
      return new LongBreak(holidayNamesIn(calendar, kept[0]), kept);
    })
    .sort((a, b) => a.base.start.iso.localeCompare(b.base.start.iso));
}

/**
 * 연차 수마다 가장 길게 쉬는 방법만 남긴다.
 * 연차를 더 쓰는 방법은 쓴 날수보다 더 늘어날 때(징검다리를 메워 주말·공휴일과 이어질 때)만 남긴다 —
 * 하루 쓰고 하루 느는 건 아무 주말에나 할 수 있어 추천할 거리가 아니다.
 */
function keepWorthwhile(options: BreakOption[], maxTies: number): BreakOption[] {
  const byLeave = Map.groupBy(options, (o) => o.leaveCount);
  const kept: BreakOption[] = [];
  let previous: { leave: number; length: number } | undefined;

  for (const leave of [...byLeave.keys()].sort((a, b) => a - b)) {
    const candidates = byLeave.get(leave)!;
    const best = Math.max(...candidates.map((o) => o.length));
    if (previous && best - previous.length <= leave - previous.leave) continue;
    previous = { leave, length: best };
    kept.push(
      ...candidates
        .filter((o) => o.length === best)
        .sort((a, b) => a.start.iso.localeCompare(b.start.iso))
        .slice(0, maxTies),
    );
  }
  return kept;
}

function holidayNamesIn(calendar: HolidayCalendar, option: BreakOption): string[] {
  const names = new Set<string>();
  for (const date of option.dates()) {
    for (const name of calendar.holidayNamesOn(date)) names.add(name);
  }
  return [...names];
}
