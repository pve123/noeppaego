import { CalendarDate } from "./calendar-date";

/** 연휴를 쉬는 한 가지 방법 — 시작·끝과 그 사이에 쓸 연차. */
export class BreakOption {
  constructor(
    readonly start: CalendarDate,
    readonly end: CalendarDate,
    readonly leaveDays: readonly CalendarDate[],
  ) {}

  get length(): number {
    return this.start.daysUntil(this.end) + 1;
  }

  get leaveCount(): number {
    return this.leaveDays.length;
  }

  isLeaveDay(date: CalendarDate): boolean {
    return this.leaveDays.some((d) => d.equals(date));
  }

  *dates(): Generator<CalendarDate> {
    for (let d = this.start; !d.isAfter(this.end); d = d.plusDays(1)) yield d;
  }
}

/**
 * 공휴일 하나(또는 붙어 있는 여러 개)를 중심으로 한 연휴.
 * options[0] 이 연차를 가장 적게 쓰는 방법이고, 뒤로 갈수록 연차를 더 써서 길게 쉰다.
 */
export class LongBreak {
  constructor(
    readonly holidayNames: readonly string[],
    readonly options: readonly BreakOption[],
  ) {
    if (options.length === 0) throw new Error("연휴에는 쉬는 방법이 하나 이상 있어야 합니다");
  }

  get base(): BreakOption {
    return this.options[0];
  }

  /** 연차를 더 써서 늘리는 방법 — 기본과 연차 수가 같은 다른 방법(수요일 공휴일의 앞·뒤)은 넣지 않는다 */
  get extensions(): readonly BreakOption[] {
    return this.options.slice(1).filter((o) => o.leaveCount > this.base.leaveCount);
  }

  /** 연차 없이 쉬는 연휴 */
  get isFree(): boolean {
    return this.base.leaveCount === 0;
  }
}
