const DAY_MS = 86_400_000;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 시간대 없는 달력 날짜(값 객체).
 * 계산은 UTC 자정 기준으로 해서 서버가 어느 시간대에서 돌든 결과가 같다.
 */
export class CalendarDate {
  private constructor(readonly iso: string) {}

  static of(iso: string): CalendarDate {
    if (!ISO_DATE.test(iso)) throw new Error(`날짜 형식이 아닙니다: ${iso}`);
    return new CalendarDate(iso);
  }

  static fromYmd(year: number, month: number, day: number): CalendarDate {
    return CalendarDate.fromEpoch(Date.UTC(year, month - 1, day));
  }

  /** 그 시간대의 오늘 날짜. 한국 기준이면 `Asia/Seoul`. */
  static todayIn(timeZone: string, now: Date): CalendarDate {
    const iso = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    return CalendarDate.of(iso);
  }

  private static fromEpoch(ms: number): CalendarDate {
    return new CalendarDate(new Date(ms).toISOString().slice(0, 10));
  }

  private get epoch(): number {
    return Date.UTC(this.year, this.month - 1, this.day);
  }

  get year(): number {
    return Number(this.iso.slice(0, 4));
  }

  get month(): number {
    return Number(this.iso.slice(5, 7));
  }

  get day(): number {
    return Number(this.iso.slice(8, 10));
  }

  /** 0 = 일요일 … 6 = 토요일 */
  get weekday(): number {
    return new Date(this.epoch).getUTCDay();
  }

  get weekdayLabel(): string {
    return WEEKDAY_LABELS[this.weekday];
  }

  get isWeekend(): boolean {
    return this.weekday === 0 || this.weekday === 6;
  }

  plusDays(days: number): CalendarDate {
    return CalendarDate.fromEpoch(this.epoch + days * DAY_MS);
  }

  /** this 에서 other 까지 며칠. other 가 앞이면 음수. */
  daysUntil(other: CalendarDate): number {
    return Math.round((other.epoch - this.epoch) / DAY_MS);
  }

  isBefore(other: CalendarDate): boolean {
    return this.iso < other.iso;
  }

  isAfter(other: CalendarDate): boolean {
    return this.iso > other.iso;
  }

  equals(other: CalendarDate): boolean {
    return this.iso === other.iso;
  }

  /** 화면용 `10.3(토)` */
  get label(): string {
    return `${this.month}.${this.day}(${this.weekdayLabel})`;
  }

  toString(): string {
    return this.iso;
  }
}
