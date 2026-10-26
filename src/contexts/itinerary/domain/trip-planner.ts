import { Coordinate } from "@/shared/kernel/coordinate";
import { Place } from "./place";

/** 연휴가 길어도 한 지역 일정은 2박 3일까지 — 그 이상은 한 지역에 머물기엔 길다. */
export const MAX_TRIP_DAYS = 3;

export type Visit = { readonly time: "morning" | "afternoon"; readonly kind: "visit"; readonly place: Place };
export type Meal = {
  readonly time: "lunch" | "dinner";
  readonly kind: "meal";
  /** 이 근처에서 먹는다 — 앞(없으면 뒤) 방문지 */
  readonly near: Coordinate;
  readonly choice?: Place;
  /** 같은 근처의 다른 후보 */
  readonly alternatives: readonly Place[];
};
export type Stay = { readonly time: "night"; readonly kind: "stay"; readonly near: Coordinate; readonly choice?: Place };
export type Home = { readonly time: "home"; readonly kind: "home" };
export type Slot = Visit | Meal | Stay | Home;
export type SlotTime = Slot["time"];

export type TripDay = { readonly date: string; readonly slots: readonly Slot[] };

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
 *
 * 방문지가 하나도 없으면 빈 배열 — 일정을 짤 수 없는 지역이다.
 */
export function draftTrip(dates: readonly string[], sights: readonly Place[], festivals: readonly Place[]): TripDay[] {
  if (sights.length === 0 && festivals.length === 0) return [];

  const used = new Set<string>();
  let previous: Coordinate | undefined;

  const pick = (date: string): Place | undefined => {
    const festival = festivals.find(
      (f) => !used.has(f.id) && f.period && f.period.start <= date && date <= f.period.end,
    );
    const place = festival ?? nearest(sights.filter((s) => !used.has(s.id)), previous);
    if (place) {
      used.add(place.id);
      previous = place.location;
    }
    return place;
  };

  return dates.map((date, dayIndex) => {
    const times = layoutOf(dayIndex, dates.length);
    const visits = new Map<SlotTime, Place>();
    for (const time of times) {
      if (time === "morning" || time === "afternoon") {
        const place = pick(date);
        if (place) visits.set(time, place);
      }
    }

    const ordered = times.flatMap((t) => (visits.has(t) ? [visits.get(t)!] : []));
    const lastVisit = ordered.at(-1)?.location ?? previous;
    const slots: Slot[] = [];
    times.forEach((time, i) => {
      if (time === "morning" || time === "afternoon") {
        const place = visits.get(time);
        if (place) slots.push({ time, kind: "visit", place });
      } else if (time === "lunch" || time === "dinner") {
        const before = times.slice(0, i).flatMap((t) => (visits.has(t) ? [visits.get(t)!] : [])).at(-1);
        const after = times.slice(i + 1).flatMap((t) => (visits.has(t) ? [visits.get(t)!] : []))[0];
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
}

/** 식사 칸을 앞에서부터 센 순서 — 후보 목록을 이 순서로 넘긴다 */
export function mealsOf(days: readonly TripDay[]): Meal[] {
  return days.flatMap((d) => d.slots.filter((s): s is Meal => s.kind === "meal"));
}

/**
 * 식사 칸마다 가장 가까운 식당을 고른다. 이미 고른 곳(같은 id·같은 이름)은 다시 고르지 않는다.
 * @param candidates mealsOf 순서대로, 칸마다 근처 식당 목록
 */
export function fillMeals(days: readonly TripDay[], candidates: readonly (readonly Place[])[], alternatives = 2): TripDay[] {
  const chosen = new Set<string>();
  let index = 0;
  return days.map((day) => ({
    ...day,
    slots: day.slots.map((slot) => {
      if (slot.kind !== "meal") return slot;
      const fresh = sortByDistance(candidates[index++] ?? [], slot.near).filter(
        (p) => !chosen.has(p.id) && !chosen.has(p.title),
      );
      const [choice, ...rest] = fresh;
      if (choice) chosen.add(choice.id).add(choice.title);
      return { ...slot, choice, alternatives: rest.slice(0, alternatives) };
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
