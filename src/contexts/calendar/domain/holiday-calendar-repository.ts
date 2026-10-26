import { HolidayCalendar } from "./holiday-calendar";

/** 포트 — 공휴일 자료를 어디서 가져오는지는 infrastructure 가 정한다. */
export interface HolidayCalendarRepository {
  findByYear(year: number): Promise<HolidayCalendar>;
}
