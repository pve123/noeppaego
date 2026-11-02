import { describe, expect, it } from "vitest";
import { CalendarDate } from "./calendar-date";
import { bestLeavePlan } from "./leave-budget";
import { BreakOption, LongBreak } from "./long-break";

/** 길이와 연차 수만 맞춘 쉬는 방법 — 날짜는 계산에 쓰지 않는다 */
const option = (length: number, leave: number) => {
  const start = CalendarDate.of("2026-01-01");
  return new BreakOption(start, start.plusDays(length - 1), Array.from({ length: leave }, (_, i) => start.plusDays(i)));
};
const longBreak = (name: string, ...options: [number, number][]) => new LongBreak([name], options.map(([l, c]) => option(l, c)));
const summary = (picks: ReturnType<typeof bestLeavePlan>) => picks.map((p) => `${p.longBreak.holidayNames[0]} ${p.option.length}일/연차${p.option.leaveCount}`);

describe("bestLeavePlan — 남은 연차로 가장 오래 쉬기", () => {
  const seol = longBreak("설", [5, 0], [9, 2]); // 연차 2개로 4일 더
  const may = longBreak("5월", [3, 0], [5, 1]); // 연차 1개로 2일 더
  const chuseok = longBreak("추석", [4, 1], [10, 2]); // 연차 없이는 못 쉬고, 2개면 10일

  it("연차가 없으면 연차 없이 쉬는 연휴만", () => {
    expect(summary(bestLeavePlan([seol, may, chuseok], 0))).toEqual(["설 5일/연차0", "5월 3일/연차0"]);
  });

  it("연차를 가장 크게 늘리는 곳에 쓴다 — 2개면 추석 10일(연차 없이는 0일)이 설 4일 늘리기보다 낫다", () => {
    expect(summary(bestLeavePlan([seol, may, chuseok], 2))).toEqual(["설 5일/연차0", "5월 3일/연차0", "추석 10일/연차2"]);
  });

  it("넉넉하면 모두 길게 — 남는 연차는 쓰지 않는다", () => {
    const picks = bestLeavePlan([seol, may, chuseok], 20);
    expect(summary(picks)).toEqual(["설 9일/연차2", "5월 5일/연차1", "추석 10일/연차2"]);
    expect(picks.reduce((n, p) => n + p.option.leaveCount, 0)).toBe(5);
  });

  it("같은 날수면 연차를 덜 쓰는 쪽", () => {
    const tie = longBreak("동점", [3, 0], [4, 1], [4, 2]);
    expect(summary(bestLeavePlan([tie], 2))).toEqual(["동점 4일/연차1"]);
  });
});
