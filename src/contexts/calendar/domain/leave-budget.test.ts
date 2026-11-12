import { describe, expect, it } from "vitest";
import { CalendarDate } from "./calendar-date";
import { bestLeavePlan, leavePlanTotals } from "./leave-budget";
import { BreakOption, LongBreak } from "./long-break";

/** start 부터 length 일 쉬고 앞에서 leave 일을 연차로 쓰는 방법 — 겹치지 않는 연휴는 서로 다른 달에 둔다 */
const option = (startIso: string, length: number, leave: number) => {
  const start = CalendarDate.of(startIso);
  return new BreakOption(start, start.plusDays(length - 1), Array.from({ length: leave }, (_, i) => start.plusDays(i)));
};
const longBreak = (name: string, startIso: string, ...options: [number, number][]) =>
  new LongBreak([name], options.map(([l, c]) => option(startIso, l, c)));
const summary = (picks: ReturnType<typeof bestLeavePlan>) => picks.map((p) => `${p.longBreak.holidayNames[0]} ${p.option.length}일/연차${p.option.leaveCount}`);

describe("bestLeavePlan — 남은 연차로 가장 오래 쉬기", () => {
  const seol = longBreak("설", "2026-02-01", [5, 0], [9, 2]); // 연차 2개로 4일 더
  const may = longBreak("5월", "2026-05-01", [3, 0], [5, 1]); // 연차 1개로 2일 더
  const chuseok = longBreak("추석", "2026-09-01", [4, 1], [10, 2]); // 연차 없이는 못 쉬고, 2개면 10일

  it("연차가 없으면 연차 없이 쉬는 연휴만", () => {
    expect(summary(bestLeavePlan([seol, may, chuseok], 0))).toEqual(["설 5일/연차0", "5월 3일/연차0"]);
  });

  it("연차를 가장 크게 늘리는 곳에 쓴다 — 2개면 추석 10일(연차 없이는 0일)이 설 4일 늘리기보다 낫다", () => {
    expect(summary(bestLeavePlan([seol, may, chuseok], 2))).toEqual(["설 5일/연차0", "5월 3일/연차0", "추석 10일/연차2"]);
  });

  it("넉넉하면 모두 길게 — 남는 연차는 쓰지 않는다", () => {
    const picks = bestLeavePlan([seol, may, chuseok], 20);
    expect(summary(picks)).toEqual(["설 9일/연차2", "5월 5일/연차1", "추석 10일/연차2"]);
    expect(leavePlanTotals(picks)).toEqual({ days: 24, leave: 5 });
  });

  it("같은 날수면 연차를 덜 쓰는 쪽", () => {
    const tie = longBreak("동점", "2026-03-01", [3, 0], [4, 1], [4, 2]);
    expect(summary(bestLeavePlan([tie], 2))).toEqual(["동점 4일/연차1"]);
  });
});

describe("bestLeavePlan — 이웃한 연휴가 날짜를 나눠 가질 때", () => {
  // 2027년 5월: 노동절(토)·대체공휴일(월) 연휴와 어린이날(수) 연휴가 5월 5일을 함께 갖는다
  const d = (iso: string) => CalendarDate.of(iso);
  const labor = new LongBreak(
    ["노동절"],
    [
      new BreakOption(d("2027-05-01"), d("2027-05-03"), []), // 토~월 3일
      new BreakOption(d("2027-05-01"), d("2027-05-05"), [d("2027-05-04")]), // 화요일 연차로 수요일 어린이날까지 5일
    ],
  );
  const children = new LongBreak(
    ["어린이날"],
    [new BreakOption(d("2027-05-05"), d("2027-05-09"), [d("2027-05-06"), d("2027-05-07")])], // 목·금 연차로 일요일까지 5일
  );

  it("겹치는 날은 한 번만 센다 — 05.01~05.09 는 10일이 아니라 9일", () => {
    const picks = bestLeavePlan([labor, children], 3);
    expect(summary(picks)).toEqual(["노동절 5일/연차1", "어린이날 5일/연차2"]);
    expect(leavePlanTotals(picks)).toEqual({ days: 9, leave: 3 });
  });

  it("연차가 모자라면 겹치지 않게 고른다 — 2개면 노동절 3일과 어린이날 5일로 8일", () => {
    const picks = bestLeavePlan([labor, children], 2);
    expect(summary(picks)).toEqual(["노동절 3일/연차0", "어린이날 5일/연차2"]);
    expect(leavePlanTotals(picks)).toEqual({ days: 8, leave: 2 });
  });

  it("겹쳐서 늘어나는 날이 없으면 더 쓰지 않는다 — 같은 날을 두 번 세면 1일을 위해 연차를 더 쓰게 된다", () => {
    // 두 연휴 모두 05.01~05.05 를 덮는 방법만 있으면 둘째 연휴는 하루도 보태지 못한다
    const same = new LongBreak(["같은 날"], [new BreakOption(d("2027-05-01"), d("2027-05-05"), [d("2027-05-04")])]);
    const picks = bestLeavePlan([labor, same], 2);
    expect(leavePlanTotals(picks)).toEqual({ days: 5, leave: 1 });
  });
});
