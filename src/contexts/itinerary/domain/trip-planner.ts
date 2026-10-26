import { Coordinate } from "@/shared/kernel/coordinate";
import { Place } from "./place";

/** 연휴가 길어도 한 지역 일정은 2박 3일까지 — 그 이상은 한 지역에 머물기엔 길다. */
export const MAX_TRIP_DAYS = 3;

export type Visit = {
  readonly time: "morning" | "afternoon";
  readonly kind: "visit";
  readonly place: Place;
  /** 비 소식이 있어 실내 장소로 골랐다 */
  readonly forRain?: boolean;
  /** 사용자가 직접 골랐다 */
  readonly picked?: boolean;
  /** 바꿀 수 있는 근처 볼거리 */
  readonly alternatives: readonly Place[];
};
export type Meal = {
  readonly time: "lunch" | "dinner";
  readonly kind: "meal";
  /** 이 근처에서 먹는다 — 앞(없으면 뒤) 방문지 */
  readonly near: Coordinate;
  readonly choice?: Place;
  /** 같은 근처의 다른 후보 */
  readonly alternatives: readonly Place[];
  /** 사용자가 직접 골랐다 */
  readonly picked?: boolean;
};
export type Stay = { readonly time: "night"; readonly kind: "stay"; readonly near: Coordinate; readonly choice?: Place };
export type Home = { readonly time: "home"; readonly kind: "home" };
export type Slot = Visit | Meal | Stay | Home;
export type SlotTime = Slot["time"];

export type TripDay = { readonly date: string; readonly slots: readonly Slot[] };

/** 사용자가 칸마다 고른 곳 — 칸 키(slotKeyOf) → 장소 id */
export type Picks = ReadonlyMap<string, string>;

/** 칸 키 `2026-12-25-lunch` */
export const slotKeyOf = (date: string, time: SlotTime) => `${date}-${time}`;

/** 관광지 칸마다 보여 줄 바꿀 후보 수 */
const VISIT_ALTERNATIVES = 3;

/**
 * 하루의 칸 — 첫날은 오는 데 오전을 쓰고, 마지막 날은 점심 먹고 돌아간다.
 * 하루짜리는 오전부터 저녁까지 돌고 돌아간다.
 */
export function layoutOf(dayIndex: number, totalDays: number): SlotTime[] {
  if (totalDays === 1) return ["morning", "lunch", "afternoon", "dinner", "home"];
  if (dayIndex === 0) return ["lunch", "afternoon", "dinner", "night"];
  if (dayIndex === totalDays - 1) return ["morning", "lunch", "home"];
  return ["morning", "lunch", "afternoon", "dinner", "night"];
}

/**
 * 일정 뼈대(도메인 서비스, 순수 함수) — 방문지를 칸에 넣고 식사·숙소는 「어디 근처」만 정한다.
 *
 * - 그날 열리는 축제가 있으면 그날 첫 방문지로 먼저 넣는다.
 * - 나머지는 바로 앞 방문지에서 가장 가까운 곳(처음은 목록 맨 앞 — 볼거리 좋은 순)으로 이어 동선을 줄인다.
 * - 같은 곳은 두 번 넣지 않는다. 방문지가 모자라면 그 칸은 뺀다.
 * - 비 오는 반나절(wet)에는 실내 장소에서 고른다. 실내가 없으면 그냥 고른다. 축제는 바꾸지 않는다.
 * - 사용자가 고른 곳(picks)이 있으면 그 칸은 그곳으로 고정하고, 다른 칸이 먼저 가져가지 않게 예약해 둔다.
 *   고른 곳이 목록에 없으면(데이터가 바뀜) 그 칸은 자동으로 고른다.
 *
 * 방문지가 하나도 없으면 빈 배열 — 일정을 짤 수 없는 지역이다.
 */
export function draftTrip(
  dates: readonly string[],
  sights: readonly Place[],
  festivals: readonly Place[],
  wet: (date: string, time: "morning" | "afternoon") => boolean = () => false,
  picks: Picks = new Map(),
): TripDay[] {
  if (sights.length === 0 && festivals.length === 0) return [];

  const everywhere = [...festivals, ...sights];
  const reserved = new Set([...picks.values()].filter((id) => everywhere.some((p) => p.id === id)));
  const used = new Set<string>();
  let previous: Coordinate | undefined;

  const pick = (date: string, time: "morning" | "afternoon"): Visit | undefined => {
    const pickedId = picks.get(slotKeyOf(date, time));
    const picked = everywhere.find((p) => p.id === pickedId && !used.has(p.id));
    const open = (p: Place) => !used.has(p.id) && !reserved.has(p.id);
    const festival = picked
      ? undefined
      : festivals.find((f) => open(f) && f.period && f.period.start <= date && date <= f.period.end);
    const free = sights.filter(open);
    const indoor = !picked && wet(date, time) ? free.filter((s) => s.indoor) : [];
    const place = picked ?? festival ?? nearest(indoor.length > 0 ? indoor : free, previous);
    if (!place) return undefined;
    used.add(place.id);
    previous = place.location;
    return {
      time,
      kind: "visit",
      place,
      forRain: !picked && !festival && indoor.length > 0 ? true : undefined,
      picked: picked ? true : undefined,
      alternatives: [],
    };
  };

  const days = dates.map((date, dayIndex) => {
    const times = layoutOf(dayIndex, dates.length);
    const visits = new Map<SlotTime, Visit>();
    for (const time of times) {
      if (time === "morning" || time === "afternoon") {
        const visit = pick(date, time);
        if (visit) visits.set(time, visit);
      }
    }

    const placesOf = (ts: SlotTime[]) => ts.flatMap((t) => (visits.has(t) ? [visits.get(t)!.place] : []));
    const lastVisit = placesOf(times).at(-1)?.location ?? previous;
    const slots: Slot[] = [];
    times.forEach((time, i) => {
      if (time === "morning" || time === "afternoon") {
        const visit = visits.get(time);
        if (visit) slots.push(visit);
      } else if (time === "lunch" || time === "dinner") {
        const before = placesOf(times.slice(0, i)).at(-1);
        const after = placesOf(times.slice(i + 1))[0];
        const near = (before ?? after)?.location ?? lastVisit;
        if (near) slots.push({ time, kind: "meal", near, alternatives: [] });
      } else if (time === "night") {
        if (lastVisit) slots.push({ time, kind: "stay", near: lastVisit });
      } else {
        slots.push({ time, kind: "home" });
      }
    });
    return { date, slots };
  });

  // 바꿀 후보 — 일정에 안 들어간 볼거리 중 그 칸 장소에서 가까운 곳
  return days.map((day) => ({
    ...day,
    slots: day.slots.map((slot) =>
      slot.kind === "visit"
        ? {
            ...slot,
            alternatives: sortByDistance(
              sights.filter((s) => !used.has(s.id)),
              slot.place.location,
            ).slice(0, VISIT_ALTERNATIVES),
          }
        : slot,
    ),
  }));
}

/** 식사 칸을 앞에서부터 센 순서 — 후보 목록을 이 순서로 넘긴다 */
export function mealsOf(days: readonly TripDay[]): Meal[] {
  return days.flatMap((d) => d.slots.filter((s): s is Meal => s.kind === "meal"));
}

/**
 * 식사 칸마다 가장 가까운 식당을 고른다. 이미 고른 곳(같은 id·같은 이름)은 다시 고르지 않는다.
 * 사용자가 고른 곳(picks)은 그 칸에 고정하고 다른 칸이 먼저 가져가지 않게 예약해 둔다.
 * @param candidates mealsOf 순서대로, 칸마다 근처 식당 목록
 */
export function fillMeals(
  days: readonly TripDay[],
  candidates: readonly (readonly Place[])[],
  alternatives = 2,
  picks: Picks = new Map(),
): TripDay[] {
  const reserved = new Set(picks.values());
  const chosen = new Set<string>();
  let index = 0;
  return days.map((day) => ({
    ...day,
    slots: day.slots.map((slot) => {
      if (slot.kind !== "meal") return slot;
      const pickedId = picks.get(slotKeyOf(day.date, slot.time));
      const fresh = sortByDistance(candidates[index++] ?? [], slot.near).filter(
        (p) => !chosen.has(p.id) && !chosen.has(p.title),
      );
      const picked = fresh.find((p) => p.id === pickedId);
      const choice = picked ?? fresh.find((p) => !reserved.has(p.id));
      const rest = fresh.filter((p) => p !== choice && p.title !== choice?.title && !reserved.has(p.id));
      if (choice) chosen.add(choice.id).add(choice.title);
      return { ...slot, choice, picked: picked ? true : undefined, alternatives: rest.slice(0, alternatives) };
    }),
  }));
}

/** 숙소는 첫 밤 근처 한 곳으로 정해 매일 같은 곳에 묵는다 — 짐 싸서 옮기지 않는다. */
export function fillStays(days: readonly TripDay[], lodgings: readonly Place[]): TripDay[] {
  const firstNight = days.flatMap((d) => d.slots).find((s): s is Stay => s.kind === "stay");
  const choice = firstNight ? nearest(lodgings, firstNight.near) : undefined;
  return days.map((day) => ({
    ...day,
    slots: day.slots.map((slot) => (slot.kind === "stay" ? { ...slot, choice } : slot)),
  }));
}

function nearest(places: readonly Place[], from: Coordinate | undefined): Place | undefined {
  if (!from) return places[0];
  return sortByDistance(places, from)[0];
}

function sortByDistance(places: readonly Place[], from: Coordinate): Place[] {
  return [...places].sort((a, b) => from.distanceKm(a.location) - from.distanceKm(b.location));
}
