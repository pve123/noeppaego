import { Coordinate } from "@/shared/kernel/coordinate";
import { Festival, Region } from "./festival";
import { TravelWindow } from "@/shared/kernel/travel-window";

export type Destination = {
  readonly region: Region;
  /** 지역 축제들의 가운데 */
  readonly center: Coordinate;
  /** 출발지에서 center 까지 직선 거리 */
  readonly distanceKm: number;
  /** 연휴와 오래 겹치는 순 */
  readonly festivals: readonly Festival[];
};

/**
 * 연휴 길이로 갈 수 있는 거리(직선, km) — 이틀이면 가까운 곳, 사흘이면 육지 어디든, 나흘 이상이면 제주까지.
 * 서울에서 강릉 약 165km · 부산 약 325km · 제주 약 450km.
 */
export function reachKm(days: number): number {
  if (days <= 2) return 150;
  if (days === 3) return 400;
  return Number.POSITIVE_INFINITY;
}

/** 출발지에서 이보다 가까운 곳은 여행지가 아니라 동네다 — 서울시청에서 서울 끝까지 약 15km. */
export const MIN_DISTANCE_KM = 20;

/**
 * 연휴에 갈 만한 지역(도메인 서비스, 순수 함수).
 * 연휴와 겹치는 축제를 시·군·구로 묶고, 동네(MIN_DISTANCE_KM)보다 멀고 갈 수 있는 거리 안에서
 * 축제가 많은 순 → 가까운 순으로 고른다.
 */
export function recommendDestinations(
  festivals: readonly Festival[],
  window: TravelWindow,
  origin: Coordinate,
  limit = 5,
): Destination[] {
  const overlapping = festivals.filter((f) => window.overlapDays(f.start, f.end) > 0);
  const byRegion = Map.groupBy(overlapping, (f) => f.region.code);
  const reach = reachKm(window.days);

  return [...byRegion.values()]
    .map((group) => {
      const center = Coordinate.centerOf(group.map((f) => f.location));
      return { region: group[0].region, center, distanceKm: origin.distanceKm(center), group };
    })
    .map(({ group, ...rest }) => ({
      ...rest,
      festivals: [...group].sort(
        (a, b) =>
          window.overlapDays(b.start, b.end) - window.overlapDays(a.start, a.end) ||
          a.start.localeCompare(b.start) ||
          a.id.localeCompare(b.id),
      ),
    }))
    .filter((d) => d.distanceKm >= MIN_DISTANCE_KM && d.distanceKm <= reach)
    .sort(
      (a, b) =>
        b.festivals.length - a.festivals.length ||
        a.distanceKm - b.distanceKm ||
        a.region.code.localeCompare(b.region.code),
    )
    .slice(0, limit);
}
