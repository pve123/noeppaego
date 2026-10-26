import { DayOutline, TripWriter } from "../domain/trip-writer";
import { ItineraryView } from "./plan-itinerary";

/**
 * 일정 하루마다 2~3문장 소개(AI). 일정과 따로 불러 화면이 기다리지 않게 한다.
 * @returns dayNumber 순서대로. 못 쓰면 undefined
 */
export async function describeItinerary(plan: ItineraryView, writer: TripWriter): Promise<string[] | undefined> {
  const outline: DayOutline[] = plan.days.map((day) => ({
    dayNumber: day.dayNumber,
    dateLabel: day.dateLabel,
    stops: day.slots.flatMap((slot) =>
      slot.place
        ? [{ time: slot.timeLabel, title: slot.place.title, category: slot.place.category, indoor: slot.place.indoor }]
        : [],
    ),
  }));
  const summaries = await writer.describe(plan.regionName, outline);
  return summaries?.length === outline.length ? summaries : undefined;
}
