import { durationLabel } from "@/shared/kernel/duration";
import { rangeText } from "@/shared/kernel/korean";
import { dateLabel, TravelWindow } from "@/shared/kernel/travel-window";
import { DriveTimes, Place, PlaceCatalog, RestaurantFinder } from "../domain/place";
import {
  draftTrip,
  fillMeals,
  fillStays,
  MAX_TRIP_DAYS,
  mealsOf,
  slotKeyOf,
  SlotTime,
  TripDay,
} from "../domain/trip-planner";
import { DayWeather, HalfDay, isWet, WeatherOutlook } from "../domain/weather";

// ── 쿼리 ─────────────────────────────────────────────

export type PlanItinerary = {
  /** 연휴(YYYY-MM-DD) — 앞에서부터 최대 MAX_TRIP_DAYS 일을 짠다 */
  start: string;
  end: string;
  /** 법정동 시·도-시·군·구(`41-480`) */
  regionCode: string;
  /** 오늘(한국, YYYY-MM-DD) — 예보 고르기 */
  today: string;
  /** 사용자가 바꾼 칸 — 칸 키(`2026-12-25-lunch`) → 장소 id */
  picks?: Record<string, string>;
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
  /** 칸 키 `2026-12-25-lunch` — 바꾸기 주소에 쓴다 */
  key: string;
  /** 사용자가 직접 바꾼 칸 */
  picked?: boolean;
  time: SlotTime;
  timeLabel: string;
  place?: PlaceView;
  /** 이 칸을 바꿀 수 있는 후보 — 식사 칸은 근처 다른 식당, 관광지 칸은 근처 다른 볼거리 */
  alternatives: PlaceView[];
  /** 장소가 없을 때 안내 */
  note?: string;
  /** 같은 날 앞 장소에서 오는 길 — 「차로 약 12분」, 길찾기를 못 하면 「직선 1.2km」 */
  travelLabel?: string;
  /** 비 소식이 있어 실내 장소로 골랐다 */
  forRain?: boolean;
};

export type WeatherView = {
  /** 칩 하나씩 — 「오전 흐리고 비 70%」「오후 구름많음 20%」「최저 2° 최고 13°」 */
  parts: string[];
  wet: boolean;
};

export type DayView = {
  dayNumber: number;
  dateLabel: string;
  /** 예보가 없는 날(10일 넘게 남음)은 undefined */
  weather?: WeatherView;
  slots: SlotView[];
};

export type ItineraryView = {
  regionName: string;
  /** 사용자가 바꾼 칸이 하나라도 있다 */
  customized: boolean;
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

/** 근처 식당 후보 수 — 고른 곳 + 바꿀 후보 + 앞 끼니와 겹칠 여유 */
const MEAL_CANDIDATES = 10;
/** 식사 칸마다 보여 줄 바꿀 후보 수 */
const MEAL_ALTERNATIVES = 3;

// ── 핸들러 ────────────────────────────────────────────

/** 일정을 짤 수 없는 지역(볼거리가 없거나 모르는 코드)이면 undefined */
export async function planItinerary(
  query: PlanItinerary,
  catalog: PlaceCatalog,
  restaurants: RestaurantFinder,
  driveTimes: DriveTimes,
  outlook: WeatherOutlook,
): Promise<ItineraryView | undefined> {
  const window = TravelWindow.of(query.start, query.end);
  const dates = window.dates(MAX_TRIP_DAYS);

  const [regionName, sights, festivals, lodgings] = await Promise.all([
    catalog.regionName(query.regionCode),
    catalog.sightsIn(query.regionCode),
    catalog.festivalsIn(query.regionCode, window),
    catalog.lodgingsIn(query.regionCode),
  ]);
  const center = (festivals[0] ?? sights[0])?.location;
  if (!regionName || !center) return undefined;

  const picks = new Map(Object.entries(query.picks ?? {}));
  const weather = await outlook.forecast(center, query.regionCode, dates, query.today);
  const draft = draftTrip(
    dates,
    sights,
    festivals,
    (date, time) => isWet(time === "morning" ? weather.get(date)?.am : weather.get(date)?.pm),
    picks,
  );

  const candidates = await Promise.all(mealsOf(draft).map((m) => restaurants.near(m.near, MEAL_CANDIDATES)));
  const days = fillStays(fillMeals(draft, candidates, MEAL_ALTERNATIVES, picks), lodgings);
  const travel = await travelLabels(days.map((d) => d.slots.map(placeOf)), driveTimes);

  return {
    regionName,
    customized: days.some((d) => d.slots.some((s) => (s.kind === "visit" || s.kind === "meal") && s.picked)),
    lengthLabel: dates.length === 1 ? "당일치기" : `${dates.length - 1}박 ${dates.length}일`,
    startLabel: dateLabel(dates[0]),
    endLabel: dateLabel(dates.at(-1)!),
    days: days.map((day, i) => ({
      dayNumber: i + 1,
      dateLabel: dateLabel(day.date),
      weather: weatherView(weather.get(day.date)),
      slots: day.slots.map((slot, j) => {
        const base = {
          key: slotKeyOf(day.date, slot.time),
          time: slot.time,
          timeLabel: TIME_LABEL[slot.time],
          alternatives: [],
          travelLabel: travel[i][j],
        };
        switch (slot.kind) {
          case "visit":
            return {
              ...base,
              place: placeView(slot.place),
              forRain: slot.forRain,
              picked: slot.picked,
              alternatives: slot.alternatives.map(placeView),
            };
          case "meal":
            return {
              ...base,
              place: slot.choice && placeView(slot.choice),
              picked: slot.picked,
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

function weatherView(day: DayWeather | undefined): WeatherView | undefined {
  if (!day || (!day.am && !day.pm)) return undefined;
  const same = day.am && day.pm && day.am.sky === day.pm.sky && day.am.rainChance === day.pm.rainChance;
  const half = (name: string, h: HalfDay | undefined) => (h ? [`${name} ${h.sky} ${h.rainChance}%`] : []);
  const sky = same ? [day.am!.sky, `비 올 확률 ${day.am!.rainChance}%`] : [...half("오전", day.am), ...half("오후", day.pm)];
  const temp = day.tempMin !== undefined && day.tempMax !== undefined ? [`최저 ${day.tempMin}° 최고 ${day.tempMax}°`] : [];
  return { parts: [...sky, ...temp], wet: isWet(day.am) || isWet(day.pm) };
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
    category: place.period ? `${rangeText(dateLabel(place.period.start), dateLabel(place.period.end))} 축제` : place.category,
    indoor: place.indoor,
  };
}
