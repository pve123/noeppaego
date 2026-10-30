import { durationLabel } from "@/shared/kernel/duration";
import { rangeText } from "@/shared/kernel/korean";
import { dotDate, TravelWindow } from "@/shared/kernel/travel-window";
import { isJeju, recommendDestinations, recommendedReach, reachMinutes, type ReachPreference } from "../domain/destination-recommender";
import { FestivalRepository } from "../domain/festival";
import { AreaNames, ORIGINS, originOf } from "../domain/origin";
import type { RoadTables } from "../domain/roads";

// ── 쿼리 ─────────────────────────────────────────────

export type FindDestinations = {
  /** YYYY-MM-DD */
  start: string;
  end: string;
  /** 출발지 id — 모르면 서울 */
  originId?: string;
  /** 얼마나 멀리 — 없으면 연휴 길이에 맞게(recommendedReach) */
  reach?: ReachPreference;
};

// ── 읽기 모델 ─────────────────────────────────────────

export type FestivalView = {
  id: string;
  title: string;
  /** 「2026.01.01부터 12.31까지」 — 끝날이 같은 해면 연도를 뺀다 */
  dateLabel: string;
  /** 연휴 내내 열린다 — 아무 날이나 가도 된다 */
  wholeBreak: boolean;
  address: string;
  imageUrl?: string;
};

export type LatLng = { lat: number; lng: number };

export type DestinationView = {
  code: string;
  name: string;
  center: LatLng;
  /** 「차로 약 3시간」 — 막히지 않을 때 기준. 제주는 「비행기나 배로」 */
  travelLabel: string;
  /** 출발지에서 center 까지 도로 모양. 모르면 undefined — 지도는 점선 직선으로 잇는다 */
  route?: LatLng[];
  festivals: FestivalView[];
};

export type DestinationsView = {
  originId: string;
  originName: string;
  origin: LatLng;
  /** 고를 수 있는 출발지 */
  origins: { id: string; name: string }[];
  /** 「차로 약 2시간 안」 같은 거리 안내. 제한이 없으면 undefined */
  reachText?: string;
  /** 고른 거리 */
  reach: ReachPreference;
  /** 연휴 길이에 맞는 거리 — 칩에 「추천」을 붙이고, 이 값이면 주소에 남기지 않는다 */
  recommended: ReachPreference;
  destinations: DestinationView[];
};

// ── 핸들러 ────────────────────────────────────────────

export async function findDestinations(
  query: FindDestinations,
  repository: FestivalRepository,
  areas: AreaNames,
  roadTables: RoadTables,
): Promise<DestinationsView> {
  const window = TravelWindow.of(query.start, query.end);
  const origin = originOf(query.originId);
  // 내 위치는 동네 이름을 붙여 어디서 재는지 보이게 — 못 찾으면 「내 위치」 그대로
  const area = origin.id.startsWith("here:") ? await areas.nameAt(origin.at) : undefined;
  const [festivals, roads] = await Promise.all([repository.findOverlapping(window), roadTables.forOrigin(origin.id)]);
  const recommended = recommendedReach(window.days);
  const preference = query.reach ?? recommended;
  const reach = reachMinutes(preference);
  const destinations = recommendDestinations(festivals, window, origin.at, undefined, preference, roads);

  return {
    originId: origin.id,
    originName: area ? `${area} 근처` : origin.name,
    origin: { lat: origin.at.lat, lng: origin.at.lng },
    origins: ORIGINS.map(({ id, name }) => ({ id, name })),
    reachText: Number.isFinite(reach) ? `차로 ${durationLabel(reach)} 안` : undefined,
    reach: preference,
    recommended,
    destinations: destinations.map((d) => ({
      code: d.region.code,
      name: d.region.name,
      center: { lat: d.center.lat, lng: d.center.lng },
      travelLabel: isJeju(d.region.code) ? "비행기나 배로" : `차로 ${durationLabel(d.driveMinutes)}`,
      route: roads.pathTo(d.region.code)?.map((p) => ({ lat: p.lat, lng: p.lng })),
      festivals: d.festivals.map((f) => ({
        id: f.id,
        title: f.title,
        dateLabel: rangeText(dotDate(f.start), f.start.slice(0, 4) === f.end.slice(0, 4) ? dotDate(f.end).slice(5) : dotDate(f.end)),
        wholeBreak: window.overlapDays(f.start, f.end) === window.days,
        address: f.address,
        imageUrl: f.imageUrl,
      })),
    })),
  };
}
