import { joinWithAnd } from "@/shared/kernel/korean";
import { CalendarDate } from "../domain/calendar-date";
import { HolidayCalendar } from "../domain/holiday-calendar";
import { HolidayCalendarRepository } from "../domain/holiday-calendar-repository";
import { BreakOption, LongBreak } from "../domain/long-break";
import { bestLeavePlan } from "../domain/leave-budget";
import { planLongBreaks } from "../domain/long-break-planner";

// ── 쿼리 ─────────────────────────────────────────────

export type FindLongBreaks = {
  /** 비우면 올해 */
  year?: number;
  today: CalendarDate;
  /** 남은 연차 — 주면 앞으로 올 연휴에 가장 오래 쉬게 나눈 계획(leavePlan)을 함께 준다 */
  leave?: number;
};

// ── 읽기 모델(화면이 그대로 쓰는 직렬화 가능한 값) ─────────────

export type DayKind = "weekend" | "holiday" | "leave";

export type DayView = {
  iso: string;
  day: number;
  weekdayLabel: string;
  kind: DayKind;
  holidayName?: string;
};

export type BreakOptionView = {
  startIso: string;
  endIso: string;
  startLabel: string;
  endLabel: string;
  length: number;
  leaveCount: number;
  leaveLabels: string[];
  days: DayView[];
};

export type BreakStatus =
  | { kind: "past" }
  | { kind: "ongoing" }
  | { kind: "upcoming"; daysLeft: number };

export type LongBreakView = {
  key: string;
  month: number;
  title: string;
  status: BreakStatus;
  base: BreakOptionView;
  extensions: BreakOptionView[];
};

/** 남은 연차로 가장 오래 쉬는 계획 — 연휴마다 고른 방법, 쓴 연차, 쉬는 날 합 */
export type LeavePlanView = {
  leave: number;
  used: number;
  totalDays: number;
  /** name 은 대표 이름 하나(「설날과 대체공휴일(설날)」 → 「설날」) — 여러 연휴를 한 줄에 늘어놓을 때 */
  picks: { key: string; title: string; name: string; option: BreakOptionView; extraDays: number }[];
};

type LongBreaksView = {
  year: number;
  /** 고를 수 있는 해 — 올해와 내년 */
  years: number[];
  /** 그 해 공휴일 발표 전이라 자료가 없다 */
  notPublished: boolean;
  holidayCount: number;
  freeBreakCount: number;
  next?: LongBreakView;
  breaks: LongBreakView[];
  leavePlan?: LeavePlanView;
};

// ── 핸들러 ────────────────────────────────────────────

export async function findLongBreaks(
  query: FindLongBreaks,
  repository: HolidayCalendarRepository,
): Promise<LongBreaksView> {
  const years = [query.today.year, query.today.year + 1];
  const year = query.year && years.includes(query.year) ? query.year : query.today.year;

  const calendar = await repository.findByYear(year);
  const planned = planLongBreaks(calendar);
  const breaks = planned.map((b) => toView(b, calendar, query.today));

  return {
    year,
    years,
    notPublished: calendar.isEmpty,
    holidayCount: calendar.holidayCount,
    freeBreakCount: breaks.filter((b) => b.base.leaveCount === 0).length,
    next: breaks.find((b) => b.status.kind !== "past"),
    breaks,
    leavePlan: query.leave === undefined || calendar.isEmpty ? undefined : leavePlanView(planned, calendar, query.today, query.leave),
  };
}

/** 앞으로 올 연휴만 — 이미 시작했거나 지난 연휴는 연차를 더 붙일 수 없다 */
function leavePlanView(planned: readonly LongBreak[], calendar: HolidayCalendar, today: CalendarDate, leave: number): LeavePlanView {
  const upcoming = planned.filter((b) => b.base.start.isAfter(today));
  const picks = bestLeavePlan(upcoming, leave);
  return {
    leave,
    used: picks.reduce((n, p) => n + p.option.leaveCount, 0),
    totalDays: picks.reduce((n, p) => n + p.option.length, 0),
    picks: picks.map(({ longBreak, option }) => ({
      key: longBreak.base.start.iso,
      title: joinWithAnd(longBreak.holidayNames),
      name: longBreak.holidayNames.find((n) => !n.startsWith("대체공휴일")) ?? longBreak.holidayNames[0],
      option: optionView(option, calendar),
      extraDays: option.length - longBreak.base.length,
    })),
  };
}

export type FindLongBreak = {
  /** 연휴 기본 방법(연차를 가장 적게 쓰는)의 시작일 — LongBreakView.key */
  start: CalendarDate;
  today: CalendarDate;
};

/**
 * 연휴 하나. 1월 연휴는 전년 12월 말에 시작할 수 있어 시작일의 해와 다음 해를 같이 본다.
 * 작년·올해·내년 밖이면 찾지 않는다 — 작년 연휴도 넣어 해가 바뀌어도 저장·공유한 일정의 링크가 열리게.
 */
export async function findLongBreak(
  query: FindLongBreak,
  repository: HolidayCalendarRepository,
): Promise<LongBreakView | undefined> {
  const years = [query.start.year, query.start.year + 1].filter(
    (y) => y >= query.today.year - 1 && y <= query.today.year + 1,
  );
  for (const year of years) {
    const calendar = await repository.findByYear(year);
    const found = planLongBreaks(calendar).find((b) => b.base.start.equals(query.start));
    if (found) return toView(found, calendar, query.today);
  }
  return undefined;
}

function toView(longBreak: LongBreak, calendar: HolidayCalendar, today: CalendarDate): LongBreakView {
  const { base } = longBreak;
  return {
    key: base.start.iso,
    month: firstHolidayIn(base, calendar)?.month ?? base.start.month,
    title: joinWithAnd(longBreak.holidayNames),
    status: statusOf(base, today),
    base: optionView(base, calendar),
    extensions: longBreak.extensions.map((o) => optionView(o, calendar)),
  };
}

function statusOf(option: BreakOption, today: CalendarDate): BreakStatus {
  if (option.end.isBefore(today)) return { kind: "past" };
  if (!option.start.isAfter(today)) return { kind: "ongoing" };
  return { kind: "upcoming", daysLeft: today.daysUntil(option.start) };
}

function optionView(option: BreakOption, calendar: HolidayCalendar): BreakOptionView {
  return {
    startIso: option.start.iso,
    endIso: option.end.iso,
    startLabel: option.start.label,
    endLabel: option.end.label,
    length: option.length,
    leaveCount: option.leaveCount,
    leaveLabels: option.leaveDays.map((d) => d.label),
    days: [...option.dates()].map((d) => dayView(d, option, calendar)),
  };
}

function dayView(date: CalendarDate, option: BreakOption, calendar: HolidayCalendar): DayView {
  const holidayName = joinWithAnd(calendar.holidayNamesOn(date)) || undefined;
  const kind: DayKind = option.isLeaveDay(date) ? "leave" : holidayName ? "holiday" : "weekend";
  return { iso: date.iso, day: date.day, weekdayLabel: date.weekdayLabel, kind, holidayName };
}

/** 12월 말 주말에서 시작하는 1월 연휴가 12월에 묶이지 않게, 묶는 달은 공휴일 기준으로 정한다. */
function firstHolidayIn(option: BreakOption, calendar: HolidayCalendar): CalendarDate | undefined {
  return [...option.dates()].find((d) => calendar.isWeekdayHolidayOfYear(d));
}
