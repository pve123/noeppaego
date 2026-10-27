import { rangeText } from "@/shared/kernel/korean";
import { dotDate, TravelWindow } from "@/shared/kernel/travel-window";
import { recommendDestinations, reachKm } from "../domain/destination-recommender";
import { FestivalRepository } from "../domain/festival";
import { ORIGINS, originOf } from "../domain/origin";

// ── 쿼리 ─────────────────────────────────────────────

export type FindDestinations = {
  /** YYYY-MM-DD */
  start: string;
  end: string;
  /** 출발지 id — 모르면 서울 */
  originId?: string;
};

// ── 읽기 모델 ─────────────────────────────────────────

export type FestivalView = {
  id: string;
  title: string;
  dateLabel: string;
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
  const reach = reachKm(window.days);
  const destinations = recommendDestinations(festivals, window, origin.at);

  return {
    originId: origin.id,
    originName: origin.name,
    origin: { lat: origin.at.lat, lng: origin.at.lng },
    origins: ORIGINS.map(({ id, name }) => ({ id, name })),
    reachKm: Number.isFinite(reach) ? reach : undefined,
    destinations: destinations.map((d) => ({
      code: d.region.code,
      name: d.region.name,
      center: { lat: d.center.lat, lng: d.center.lng },
      distanceKm: Math.round(d.distanceKm),
      festivals: d.festivals.map((f) => ({
        id: f.id,
        title: f.title,
        dateLabel: rangeText(dotDate(f.start), dotDate(f.end)),
        address: f.address,
        imageUrl: f.imageUrl,
      })),
    })),
  };
}
