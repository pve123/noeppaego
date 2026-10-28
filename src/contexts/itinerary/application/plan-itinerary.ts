import { durationLabel, estimateDriveMinutes } from "@/shared/kernel/duration";
import { rangeText } from "@/shared/kernel/korean";
import { dateLabel, TravelWindow } from "@/shared/kernel/travel-window";
import { DriveTimes, Place, PlaceCatalog, PlaceIntros, PlaceKind, PlacePages, RestaurantFinder } from "../domain/place";
import {
  draftTrip,
  fillMeals,
  fillStays,
  stayKeyOf,
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
  /** 관광지·문화시설·축제·식당·숙소 — 뱃지 색. 예전에 저장한 일정에는 없다 */
  kind?: PlaceKind;
  title: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  url?: string;
  /** 「한식」「한옥」「문화시설」 같은 짧은 분류. 예전에 저장한 축제는 「…부터 …까지 축제」 */
  category?: string;
  /** 축제 기간 — 「2026.10.31(토)부터 2026.12.31(목)까지」 */
  period?: string;
  /** 한 줄 소개(관광공사 소개 첫 문장) — 일정에 고른 관광지·축제·숙소만 */
  intro?: string;
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
  /** 같은 날 앞 장소에서 오는 길 — 「차로 약 12분」. 길찾기를 못 하면 직선 거리로 어림한 같은 모양(예전에 저장한 일정은 「직선 1.2km」일 수 있다) */
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
  pages: PlacePages,
  intros: PlaceIntros,
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
  const days = await withStayPage(fillStays(fillMeals(draft, candidates, MEAL_ALTERNATIVES, picks), lodgings, picks), pages);
  const stayKey = stayKeyOf(days);
  const introOf = await introsOf(days, intros);
  const travel = await travelLabels(days.map((d) => d.slots.map(placeOf)), driveTimes);

  return {
    regionName,
    customized: days.some((d) => d.slots.some((s) => (s.kind === "visit" || s.kind === "meal" || s.kind === "stay") && s.picked)),
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
              place: placeView(slot.place, introOf.get(slot.place.id)),
              forRain: slot.forRain,
              picked: slot.picked,
              alternatives: slot.alternatives.map((p) => placeView(p)),
            };
          case "meal":
            return {
              ...base,
              place: slot.choice && placeView(slot.choice, introOf.get(slot.choice.id)),
              picked: slot.picked,
              alternatives: slot.alternatives.map((p) => placeView(p)),
              note: slot.choice ? undefined : "근처에 등록된 식당을 찾지 못했어요",
            };
          case "stay":
            return {
              ...base,
              // 연휴 내내 같은 숙소라 어느 밤에서 바꿔도 첫 밤 칸 하나로 고른다
              key: stayKey ?? base.key,
              place: slot.choice && placeView(slot.choice, introOf.get(slot.choice.id)),
              picked: slot.picked,
              alternatives: (slot.alternatives ?? []).map((p) => placeView(p)),
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
          const minutes =
            (await driveTimes.minutes(leg.from.location, leg.to.location)) ??
            estimateDriveMinutes(leg.from.location.distanceKm(leg.to.location));
          return `차로 ${durationLabel(minutes)}`;
        }),
      );
    }),
  );
}

/**
 * 고른 숙소에 카카오맵 페이지를 붙인다 — 관광공사 숙소엔 별점·리뷰가 없어 식당처럼 「별점과 리뷰」로 보낸다.
 * 연휴 내내 한 숙소라 한 번만 찾는다. 못 찾으면 버튼 없이 둔다.
 */
async function withStayPage(days: TripDay[], pages: PlacePages): Promise<TripDay[]> {
  const stay = days.flatMap((d) => d.slots).find((s) => s.kind === "stay" && s.choice);
  const choice = stay?.kind === "stay" ? stay.choice : undefined;
  if (!choice || choice.url) return days;
  const url = await pages.kakaoPageOf(choice);
  if (!url) return days;
  const linked = { ...choice, url };
  return days.map((day) => ({
    ...day,
    slots: day.slots.map((slot) => (slot.kind === "stay" && slot.choice?.id === choice.id ? { ...slot, choice: linked } : slot)),
  }));
}

/** 일정에 고른 장소(바꾸기 후보 말고)의 한 줄 소개 — 장소 id → 소개 */
async function introsOf(days: TripDay[], intros: PlaceIntros): Promise<Map<string, string>> {
  const chosen = new Map(days.flatMap((d) => d.slots.flatMap((s) => {
    const p = placeOf(s);
    return p ? [[p.id, p] as const] : [];
  })));
  const found = await Promise.all([...chosen.values()].map(async (p) => [p.id, await intros.introOf(p)] as const));
  return new Map(found.flatMap(([id, intro]) => (intro ? [[id, intro] as const] : [])));
}

function placeView(place: Place, intro?: string): PlaceView {
  return {
    id: place.id,
    kind: place.kind,
    title: place.title,
    address: place.address,
    lat: place.location.lat,
    lng: place.location.lng,
    imageUrl: place.imageUrl,
    url: place.url,
    category: place.period ? "축제" : place.category,
    period: place.period ? rangeText(dateLabel(place.period.start), dateLabel(place.period.end)) : undefined,
    intro,
    indoor: place.indoor,
  };
}
