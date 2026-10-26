import "server-only";
import { unwrap } from "@/shared/public-data/public-data";
import { CalendarDate } from "../domain/calendar-date";
import { HolidayCalendar } from "../domain/holiday-calendar";
import { HolidayCalendarRepository } from "../domain/holiday-calendar-repository";
import { fetchRestDays } from "./spcde-info-client";

export class SpcdeHolidayCalendarRepository implements HolidayCalendarRepository {
  async findByYear(year: number): Promise<HolidayCalendar> {
    const restDays = unwrap(await fetchRestDays(year));

    // 12월 말 연휴가 해를 넘길 수 있어 다음 해 신정을 붙인다.
    // 신정은 매년 1월 1일로 고정이라 다음 해 자료가 아직 없어도 넣을 수 있다.
    const holidays = [...restDays, { date: `${year + 1}-01-01`, name: "신정" }];
    return new HolidayCalendar(
      year,
      holidays.map(({ date, name }) => ({ date: CalendarDate.of(date), name })),
    );
  }
}
