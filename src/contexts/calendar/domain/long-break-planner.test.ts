import { describe, expect, it } from "vitest";
import { CalendarDate } from "./calendar-date";
import { HolidayCalendar } from "./holiday-calendar";
import { LongBreak } from "./long-break";
import { planLongBreaks } from "./long-break-planner";

// 2026-01-01 은 목요일이다.
const calendarOf = (...holidays: [string, string][]) =>
  new HolidayCalendar(
    2026,
    holidays.map(([iso, name]) => ({ date: CalendarDate.of(iso), name })),
  );

const summary = (b: LongBreak) =>
  b.options.map((o) => ({
    range: `${o.start.iso}~${o.end.iso}`,
    length: o.length,
    leave: o.leaveDays.map((d) => d.iso),
  }));

describe("planLongBreaks", () => {
  it("금요일 공휴일은 연차 없이 3일 — 연차를 붙여도 쓴 만큼만 늘어 늘리는 방법은 없다", () => {
    const [b] = planLongBreaks(calendarOf(["2026-01-16", "금요일 공휴일"]));

    expect(b.holidayNames).toEqual(["금요일 공휴일"]);
    expect(summary(b)).toEqual([{ range: "2026-01-16~2026-01-18", length: 3, leave: [] }]);
  });

  it("목요일 공휴일은 금요일 연차 하루로 4일 — 연차 없는 방법은 없다", () => {
    const [b] = planLongBreaks(calendarOf(["2026-01-01", "신정"]));

    expect(b.isFree).toBe(false);
    expect(summary(b)[0]).toEqual({ range: "2026-01-01~2026-01-04", length: 4, leave: ["2026-01-02"] });
  });

  it("수요일 공휴일은 연차 이틀로 5일 — 앞쪽·뒤쪽 두 방법", () => {
    const [b] = planLongBreaks(calendarOf(["2026-01-07", "수요일 공휴일"]));

    expect(summary(b)).toEqual([
      { range: "2026-01-03~2026-01-07", length: 5, leave: ["2026-01-05", "2026-01-06"] },
      { range: "2026-01-07~2026-01-11", length: 5, leave: ["2026-01-08", "2026-01-09"] },
    ]);
  });

  it("월~수 설 연휴는 연차 없이 5일, 목·금 연차로 9일 — 연차 하루로 6일은 보여 주지 않는다", () => {
    const [b] = planLongBreaks(
      calendarOf(["2026-02-16", "설날"], ["2026-02-17", "설날"], ["2026-02-18", "설날"]),
    );

    expect(b.holidayNames).toEqual(["설날"]);
    expect(summary(b)).toEqual([
      { range: "2026-02-14~2026-02-18", length: 5, leave: [] },
      { range: "2026-02-14~2026-02-22", length: 9, leave: ["2026-02-19", "2026-02-20"] },
    ]);
  });

  it("주말에 걸린 공휴일은 연휴를 만들지 않는다", () => {
    expect(planLongBreaks(calendarOf(["2026-01-03", "토요일 공휴일"]))).toEqual([]);
  });

  it("같은 날 공휴일 이름이 둘이면 둘 다 보여 준다", () => {
    const [b] = planLongBreaks(calendarOf(["2026-01-16", "개천절"], ["2026-01-16", "추석"]));

    expect(b.holidayNames).toEqual(["개천절", "추석"]);
  });

  it("다음 해 1월 1일을 넣으면 해를 넘기는 연휴도 잡는다", () => {
    // 2026-12-31 목요일, 2027-01-01 금요일
    const [b] = planLongBreaks(
      calendarOf(["2026-12-31", "목요일 공휴일"], ["2027-01-01", "신정"]),
    );

    expect(summary(b)[0]).toEqual({ range: "2026-12-31~2027-01-03", length: 4, leave: [] });
  });

  it("연휴는 날짜 순으로 나온다", () => {
    const breaks = planLongBreaks(calendarOf(["2026-02-16", "설날"], ["2026-01-16", "금요일 공휴일"]));

    expect(breaks.map((b) => b.base.start.iso)).toEqual(["2026-01-16", "2026-02-14"]);
  });
});

describe("LongBreak.extensions", () => {
  it("수요일 공휴일의 앞·뒤 방법처럼 연차 수가 같은 방법은 늘리는 방법으로 치지 않는다", () => {
    // 2026-01-14 는 수요일
    const [b] = planLongBreaks(calendarOf(["2026-01-14", "수요일 공휴일"]));
    expect(b.options.length).toBeGreaterThan(1);
    expect(b.extensions.every((o) => o.leaveCount > b.base.leaveCount)).toBe(true);
    expect(b.options.filter((o) => o.leaveCount === b.base.leaveCount).length).toBeGreaterThan(1);
  });
});
