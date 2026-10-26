const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const epochDay = (iso: string) =>
  Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / DAY_MS;

/**
 * 여행 기간(값 객체) — 시작·끝 날짜(YYYY-MM-DD, 둘 다 포함).
 * calendar 컨텍스트의 날짜 타입에 기대지 않으려고 ISO 문자열로만 받는다.
 */
export class TravelWindow {
  private constructor(
    readonly start: string,
    readonly end: string,
  ) {}

  static of(start: string, end: string): TravelWindow {
    if (!ISO_DATE.test(start) || !ISO_DATE.test(end)) throw new Error(`날짜 형식이 아닙니다: ${start}~${end}`);
    if (end < start) throw new Error(`끝이 시작보다 앞입니다: ${start}~${end}`);
    return new TravelWindow(start, end);
  }

  get days(): number {
    return epochDay(this.end) - epochDay(this.start) + 1;
  }

  /** [start, end] 기간과 겹치는 날수. 안 겹치면 0. */
  overlapDays(start: string, end: string): number {
    const from = start > this.start ? start : this.start;
    const to = end < this.end ? end : this.end;
    return to < from ? 0 : epochDay(to) - epochDay(from) + 1;
  }
}
