import { Coordinate } from "@/shared/kernel/coordinate";
import { estimateTripMinutes } from "@/shared/kernel/duration";
import { Festival, Region } from "./festival";
import { TravelWindow } from "@/shared/kernel/travel-window";

export type Destination = {
  readonly region: Region;
  /** 지역 축제들의 가운데 */
  readonly center: Coordinate;
  /** 출발지에서 center 까지 직선 거리 */
  readonly distanceKm: number;
  /** 출발지에서 center 까지 차로 걸리는 시간(분, 직선 거리로 어림) */
  readonly driveMinutes: number;
  /** 연휴와 오래 겹치는 순 */
  readonly festivals: readonly Festival[];
};

/**
 * 얼마나 멀리 갈지 — 차로 2시간·4시간·어디든. 칩마다 값이 고정이라 두 칩의 결과가 겹치지 않는다.
 * 고르지 않으면 연휴 길이에 맞는 것(recommendedReach)을 쓴다. 서울에서 강릉 약 2시간 50분 · 부산 약 5시간 25분(estimateTripMinutes).
 */
export type ReachPreference = "2h" | "4h" | "any";
const REACH_MINUTES: Record<ReachPreference, number> = { "2h": 120, "4h": 240, any: Number.POSITIVE_INFINITY };
/** 이전 주소(`?reach=near|far`)도 비슷한 칩으로 받는다 */
const LEGACY_REACH: Record<string, ReachPreference> = { near: "2h", far: "any" };

export const reachMinutes = (preference: ReachPreference) => REACH_MINUTES[preference];

/** 연휴 길이에 맞는 거리 — 이틀이면 2시간, 사흘이면 4시간, 나흘 이상이면 어디든 */
export const recommendedReach = (days: number): ReachPreference => (days <= 2 ? "2h" : days === 3 ? "4h" : "any");

/** 주소 값 → 고른 거리. 모르는 값이면 undefined(연휴 길이에 맞게) */
export const reachPreferenceOf = (value: unknown): ReachPreference | undefined =>
  typeof value !== "string" ? undefined : Object.hasOwn(REACH_MINUTES, value) ? (value as ReachPreference) : Object.hasOwn(LEGACY_REACH, value) ? LEGACY_REACH[value] : undefined;

/**
 * 제주는 비행기·배라 차 시간으로 잴 수 없다 — 「어디든」을 고르고 사흘 이상일 때만 넣는다.
 * 코드는 법정동 시·도 코드(제주특별자치도 50).
 */
const JEJU_SIDO = "50";
const JEJU_MIN_DAYS = 3;
export const isJeju = (code: string) => code.split("-")[0] === JEJU_SIDO;

/** 출발지에서 이보다 가까운 곳은 여행지가 아니라 동네다 — 서울시청에서 서울 끝까지 약 15km. */
const MIN_DISTANCE_KM = 20;

/**
 * 연휴에 갈 만한 지역(도메인 서비스, 순수 함수).
 * 연휴와 겹치는 축제를 시·군·구로 묶고, 동네(MIN_DISTANCE_KM)보다 멀고 차로 갈 수 있는 시간 안에서
 * 축제가 많은 순 → 가까운 순으로 고른다.
 */
export function recommendDestinations(
  festivals: readonly Festival[],
  window: TravelWindow,
  origin: Coordinate,
  /** 몇 곳까지 — 기본은 조건에 맞는 곳 모두 */
  limit = Number.POSITIVE_INFINITY,
  preference: ReachPreference = recommendedReach(window.days),
): Destination[] {
  const overlapping = festivals.filter((f) => window.overlapDays(f.start, f.end) > 0);
  const byRegion = Map.groupBy(overlapping, (f) => f.region.code);
  const reach = reachMinutes(preference);
  const jeju = preference === "any" && window.days >= JEJU_MIN_DAYS;

  return [...byRegion.values()]
    .map((group) => {
      const center = Coordinate.centerOf(group.map((f) => f.location));
      const distanceKm = origin.distanceKm(center);
      return { region: group[0].region, center, distanceKm, driveMinutes: estimateTripMinutes(distanceKm), group };
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
    .filter((d) => d.distanceKm >= MIN_DISTANCE_KM && d.driveMinutes <= reach)
    .filter((d) => jeju || !isJeju(d.region.code))
    .sort(
      (a, b) =>
        b.festivals.length - a.festivals.length ||
        a.distanceKm - b.distanceKm ||
        a.region.code.localeCompare(b.region.code),
    )
    .slice(0, limit);
}
