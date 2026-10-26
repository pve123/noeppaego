import { CalendarDate } from "./calendar-date";

export type Holiday = {
  readonly date: CalendarDate;
  readonly name: string;
};

/**
 * 한 해의 쉬는 날 달력(애그리거트 루트).
 * 주말과 공휴일만 안다. 연차는 계획하는 쪽(LongBreakPlanner)이 정한다.
 */
export class HolidayCalendar {
  private readonly namesByDate = new Map<string, string[]>();

  /**
   * @param holidays 이 해의 공휴일. 해를 넘기는 연휴를 보려고 다음 해 1월 1일처럼
   *   경계 밖 날짜를 함께 넣어도 된다.
   */
  constructor(
    readonly year: number,
    holidays: readonly Holiday[],
  ) {
    for (const { date, name } of holidays) {
      const names = this.namesByDate.get(date.iso) ?? [];
      if (!names.includes(name)) names.push(name);
      this.namesByDate.set(date.iso, names);
    }
  }

  get firstDay(): CalendarDate {
    return CalendarDate.fromYmd(this.year, 1, 1);
  }

  get lastDay(): CalendarDate {
    return CalendarDate.fromYmd(this.year, 12, 31);
  }

  /** 이 해에 공휴일 자료가 하나도 없다 — 아직 발표 전인 해. */
  get isEmpty(): boolean {
    return ![...this.namesByDate.keys()].some((iso) => iso.startsWith(`${this.year}-`));
  }

  isHoliday(date: CalendarDate): boolean {
    return this.namesByDate.has(date.iso);
  }

  isRestDay(date: CalendarDate): boolean {
    return date.isWeekend || this.isHoliday(date);
  }

  /** 평일에 걸린 이 해의 공휴일 — 이게 있어야 「연휴」다. 주말에 걸린 공휴일은 쉬는 날을 늘리지 않는다. */
  isWeekdayHolidayOfYear(date: CalendarDate): boolean {
    return date.year === this.year && !date.isWeekend && this.isHoliday(date);
  }

  holidayNamesOn(date: CalendarDate): readonly string[] {
    return this.namesByDate.get(date.iso) ?? [];
  }

  get holidayCount(): number {
    return [...this.namesByDate.keys()].filter((iso) => iso.startsWith(`${this.year}-`)).length;
  }
}
