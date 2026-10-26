/**
 * calendar 컨텍스트의 공개 API — 다른 컨텍스트와 화면(app/)은 이 파일만 import 한다.
 * 의존을 여기서 조립한다(조립 루트).
 */
import "server-only";
import { findLongBreaks as handle, type FindLongBreaks } from "./application/find-long-breaks";
import { SpcdeHolidayCalendarRepository } from "./infrastructure/spcde-holiday-calendar-repository";

const repository = new SpcdeHolidayCalendarRepository();

export const findLongBreaks = (query: FindLongBreaks) => handle(query, repository);

export { CalendarDate } from "./domain/calendar-date";
export { HolidaySourceError } from "./infrastructure/spcde-info-client";
export type {
  BreakOptionView,
  BreakStatus,
  DayKind,
  DayView,
  LongBreakView,
  LongBreaksView,
} from "./application/find-long-breaks";
