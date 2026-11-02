/**
 * calendar 컨텍스트의 공개 API — 다른 컨텍스트와 화면(app/)은 이 파일만 import 한다.
 * 의존을 여기서 조립한다(조립 루트).
 */
import "server-only";
import {
  findLongBreak as handleOne,
  findLongBreaks as handleAll,
  type FindLongBreak,
  type FindLongBreaks,
} from "./application/find-long-breaks";
import { SpcdeHolidayCalendarRepository } from "./infrastructure/spcde-holiday-calendar-repository";

const repository = new SpcdeHolidayCalendarRepository();

export const findLongBreaks = (query: FindLongBreaks) => handleAll(query, repository);
export const findLongBreak = (query: FindLongBreak) => handleOne(query, repository);

export { CalendarDate } from "./domain/calendar-date";
export type {
  BreakOptionView,
  BreakStatus,
  DayKind,
  DayView,
  LongBreakView,
} from "./application/find-long-breaks";
