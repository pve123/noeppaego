import { rangeText } from "@/shared/kernel/korean";
import { dotDate, TravelWindow } from "@/shared/kernel/travel-window";
import { recommendDestinations, reachKm, type ReachPreference } from "../domain/destination-recommender";
import { FestivalRepository } from "../domain/festival";
import { ORIGINS, originOf } from "../domain/origin";

// ── 쿼리 ─────────────────────────────────────────────

export type FindDestinations = {
  /** YYYY-MM-DD */
  start: string;
  end: string;
  /** 출발지 id — 모르면 서울 */
  originId?: string;
  /** 얼마나 멀리 — 없으면 연휴 길이대로 */
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
  /** 출발지에서 직선 거리. 차 시간은 섬처럼 못 구하는 곳이 있어 카드마다 달라지므로 거리 하나로 맞춘다 */
  distanceKm: number;
  festivals: FestivalView[];
};

export type DestinationsView = {
  originId: string;
  originName: string;
  origin: LatLng;
  /** 고를 수 있는 출발지 */
  origins: { id: string; name: string }[];
  /** 「400km 안」 같은 거리 안내. 제한이 없으면 undefined */
  reachKm?: number;
  /** 고른 거리 */
  reach: ReachPreference;
  destinations: DestinationView[];
};

// ── 핸들러 ────────────────────────────────────────────

export async function findDestinations(
  query: FindDestinations,
  repository: FestivalRepository,
): Promise<DestinationsView> {
  const window = TravelWindow.of(query.start, query.end);
  const origin = originOf(query.originId);
  const festivals = await repository.findOverlapping(window);
  const preference = query.reach ?? "auto";
  const reach = reachKm(window.days, preference);
  const destinations = recommendDestinations(festivals, window, origin.at, undefined, preference);

  return {
    originId: origin.id,
    originName: origin.name,
    origin: { lat: origin.at.lat, lng: origin.at.lng },
    origins: ORIGINS.map(({ id, name }) => ({ id, name })),
    reachKm: Number.isFinite(reach) ? reach : undefined,
    reach: preference,
    destinations: destinations.map((d) => ({
      code: d.region.code,
      name: d.region.name,
      center: { lat: d.center.lat, lng: d.center.lng },
      distanceKm: Math.round(d.distanceKm),
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
