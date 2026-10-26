import { dateLabel, TravelWindow } from "@/shared/kernel/travel-window";
import { Place, PlaceCatalog, RestaurantFinder } from "../domain/place";
import { draftTrip, fillMeals, fillStays, MAX_TRIP_DAYS, mealsOf, SlotTime } from "../domain/trip-planner";

// ── 쿼리 ─────────────────────────────────────────────

export type PlanItinerary = {
  /** 연휴(YYYY-MM-DD) — 앞에서부터 최대 MAX_TRIP_DAYS 일을 짠다 */
  start: string;
  end: string;
  /** 법정동 시·도-시·군·구(`41-480`) */
  regionCode: string;
};

// ── 읽기 모델 ─────────────────────────────────────────

export type PlaceView = {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  url?: string;
  category?: string;
  indoor: boolean;
};

export type SlotView = {
  key: string;
  time: SlotTime;
  timeLabel: string;
  place?: PlaceView;
  /** 식사 칸의 다른 후보 */
  alternatives: PlaceView[];
  /** 장소가 없을 때 안내 */
  note?: string;
};

export type DayView = {
  dayNumber: number;
  dateLabel: string;
  slots: SlotView[];
};

export type ItineraryView = {
  regionName: string;
  /** 「2박 3일」 */
  lengthLabel: string;
  startLabel: string;
  endLabel: string;
  days: DayView[];
};

const TIME_LABEL: Record<SlotTime, string> = {
  morning: "오전",
  lunch: "점심",
  afternoon: "오후",
  dinner: "저녁",
  night: "숙소",
  home: "귀가",
};

/** 근처 식당 후보 수 — 고른 곳 + 다른 후보 2곳 + 앞 끼니와 겹칠 여유 */
const MEAL_CANDIDATES = 8;

// ── 핸들러 ────────────────────────────────────────────

/** 일정을 짤 수 없는 지역(볼거리가 없거나 모르는 코드)이면 undefined */
export async function planItinerary(
  query: PlanItinerary,
  catalog: PlaceCatalog,
  restaurants: RestaurantFinder,
): Promise<ItineraryView | undefined> {
  const window = TravelWindow.of(query.start, query.end);
  const dates = window.dates(MAX_TRIP_DAYS);

  const [regionName, sights, festivals, lodgings] = await Promise.all([
    catalog.regionName(query.regionCode),
    catalog.sightsIn(query.regionCode),
    catalog.festivalsIn(query.regionCode, window),
    catalog.lodgingsIn(query.regionCode),
  ]);
  const draft = draftTrip(dates, sights, festivals);
  if (!regionName || draft.length === 0) return undefined;

  const candidates = await Promise.all(mealsOf(draft).map((m) => restaurants.near(m.near, MEAL_CANDIDATES)));
  const days = fillStays(fillMeals(draft, candidates), lodgings);

  return {
    regionName,
    lengthLabel: dates.length === 1 ? "당일치기" : `${dates.length - 1}박 ${dates.length}일`,
    startLabel: dateLabel(dates[0]),
    endLabel: dateLabel(dates.at(-1)!),
    days: days.map((day, i) => ({
      dayNumber: i + 1,
      dateLabel: dateLabel(day.date),
      slots: day.slots.map((slot) => {
        const base = { key: `${day.date}-${slot.time}`, time: slot.time, timeLabel: TIME_LABEL[slot.time], alternatives: [] };
        switch (slot.kind) {
          case "visit":
            return { ...base, place: placeView(slot.place) };
          case "meal":
            return {
              ...base,
              place: slot.choice && placeView(slot.choice),
              alternatives: slot.alternatives.map(placeView),
              note: slot.choice ? undefined : "근처에 등록된 식당을 찾지 못했어요",
            };
          case "stay":
            return {
              ...base,
              place: slot.choice && placeView(slot.choice),
              note: slot.choice ? undefined : "이 지역에 등록된 숙소가 없어요",
            };
          case "home":
            return { ...base, note: "집으로 출발" };
        }
      }),
    })),
  };
}

function placeView(place: Place): PlaceView {
  return {
    id: place.id,
    title: place.title,
    address: place.address,
    lat: place.location.lat,
    lng: place.location.lng,
    imageUrl: place.imageUrl,
    url: place.url,
    category: place.period ? `축제 ${dateLabel(place.period.start)} – ${dateLabel(place.period.end)}` : place.category,
    indoor: place.indoor,
  };
}
