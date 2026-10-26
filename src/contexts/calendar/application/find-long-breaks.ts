import { CalendarDate } from "../domain/calendar-date";
import { HolidayCalendar } from "../domain/holiday-calendar";
import { HolidayCalendarRepository } from "../domain/holiday-calendar-repository";
import { BreakOption, LongBreak } from "../domain/long-break";
import { planLongBreaks } from "../domain/long-break-planner";

// ── 쿼리 ─────────────────────────────────────────────

export type FindLongBreaks = {
  /** 비우면 올해 */
  year?: number;
  today: CalendarDate;
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

export type LongBreaksView = {
  year: number;
  /** 고를 수 있는 해 — 올해와 내년 */
  years: number[];
  /** 그 해 공휴일 발표 전이라 자료가 없다 */
  notPublished: boolean;
  holidayCount: number;
  freeBreakCount: number;
  next?: LongBreakView;
  breaks: LongBreakView[];
};

// ── 핸들러 ────────────────────────────────────────────

export async function findLongBreaks(
  query: FindLongBreaks,
  repository: HolidayCalendarRepository,
): Promise<LongBreaksView> {
  const years = [query.today.year, query.today.year + 1];
  const year = query.year && years.includes(query.year) ? query.year : query.today.year;

  const calendar = await repository.findByYear(year);
  const breaks = planLongBreaks(calendar).map((b) => toView(b, calendar, query.today));

  return {
    year,
    years,
    notPublished: calendar.isEmpty,
    holidayCount: calendar.holidayCount,
    freeBreakCount: breaks.filter((b) => b.base.leaveCount === 0).length,
    next: breaks.find((b) => b.status.kind !== "past"),
    breaks,
  };
}

function toView(longBreak: LongBreak, calendar: HolidayCalendar, today: CalendarDate): LongBreakView {
  const { base } = longBreak;
  return {
    key: base.start.iso,
    month: firstHolidayIn(base, calendar)?.month ?? base.start.month,
    title: longBreak.holidayNames.join(" · "),
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
    startLabel: option.start.label,
    endLabel: option.end.label,
    length: option.length,
    leaveCount: option.leaveCount,
    leaveLabels: option.leaveDays.map((d) => d.label),
    days: [...option.dates()].map((d) => dayView(d, option, calendar)),
  };
}

function dayView(date: CalendarDate, option: BreakOption, calendar: HolidayCalendar): DayView {
  const holidayName = calendar.holidayNamesOn(date).join(" · ") || undefined;
  const kind: DayKind = option.isLeaveDay(date) ? "leave" : holidayName ? "holiday" : "weekend";
  return { iso: date.iso, day: date.day, weekdayLabel: date.weekdayLabel, kind, holidayName };
}

/** 12월 말 주말에서 시작하는 1월 연휴가 12월에 묶이지 않게, 묶는 달은 공휴일 기준으로 정한다. */
function firstHolidayIn(option: BreakOption, calendar: HolidayCalendar): CalendarDate | undefined {
  return [...option.dates()].find((d) => calendar.isWeekdayHolidayOfYear(d));
}
