import { durationLabel } from "@/shared/kernel/duration";
import { dateLabel, TravelWindow } from "@/shared/kernel/travel-window";
import { DriveTimes, Place, PlaceCatalog, RestaurantFinder } from "../domain/place";
import { draftTrip, fillMeals, fillStays, MAX_TRIP_DAYS, mealsOf, SlotTime, TripDay } from "../domain/trip-planner";

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
  /** 같은 날 앞 장소에서 오는 길 — 「차로 약 12분」, 길찾기를 못 하면 「직선 1.2km」 */
  travelLabel?: string;
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
  driveTimes: DriveTimes,
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
  const travel = await travelLabels(days.map((d) => d.slots.map(placeOf)), driveTimes);

  return {
    regionName,
    lengthLabel: dates.length === 1 ? "당일치기" : `${dates.length - 1}박 ${dates.length}일`,
    startLabel: dateLabel(dates[0]),
    endLabel: dateLabel(dates.at(-1)!),
    days: days.map((day, i) => ({
      dayNumber: i + 1,
      dateLabel: dateLabel(day.date),
      slots: day.slots.map((slot, j) => {
        const base = {
          key: `${day.date}-${slot.time}`,
          time: slot.time,
          timeLabel: TIME_LABEL[slot.time],
          alternatives: [],
          travelLabel: travel[i][j],
        };
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

function placeOf(slot: TripDay["slots"][number]): Place | undefined {
  if (slot.kind === "visit") return slot.place;
  if (slot.kind === "meal" || slot.kind === "stay") return slot.choice;
  return undefined;
}

/** 하루 안에서 장소가 있는 칸끼리 앞 → 뒤 이동 시간. 그날 첫 장소는 비운다. */
async function travelLabels(
  days: (Place | undefined)[][],
  driveTimes: DriveTimes,
): Promise<(string | undefined)[][]> {
  return Promise.all(
    days.map(async (places) => {
      let previous: Place | undefined;
      const legs = places.map((place) => {
        const from = previous;
        if (place) previous = place;
        return place && from && from.id !== place.id ? { from, to: place } : undefined;
      });
      return Promise.all(
        legs.map(async (leg) => {
          if (!leg) return undefined;
          const minutes = await driveTimes.minutes(leg.from.location, leg.to.location);
          return minutes === undefined
            ? `직선 ${leg.from.location.distanceKm(leg.to.location).toFixed(1)}km`
            : `차로 ${durationLabel(minutes)}`;
        }),
      );
    }),
  );
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
