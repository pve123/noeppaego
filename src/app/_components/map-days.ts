import type { DayView } from "@/contexts/itinerary";
import { DAY_TONES } from "./itinerary-day";
import type { MapDay } from "./itinerary-map";

/** 일정 → 지도 날짜(장소가 있는 칸만, 일차 색은 일정 카드와 같은 순서) — 일정 화면과 공유 화면이 같이 쓴다 */
export const mapDaysOf = (days: readonly DayView[]): MapDay[] =>
  days.map((day) => ({
    dayNumber: day.dayNumber,
    dateLabel: day.dateLabel,
    tone: DAY_TONES[(day.dayNumber - 1) % DAY_TONES.length],
    stops: day.slots.flatMap((slot) =>
      slot.place
        ? [{ id: `${slot.key}-${slot.place.id}`, lat: slot.place.lat, lng: slot.place.lng, title: slot.place.title, timeLabel: slot.timeLabel }]
        : [],
    ),
  }));
