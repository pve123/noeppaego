import { durationLabel } from "@/shared/kernel/duration";
import { rangeText } from "@/shared/kernel/korean";
import { TravelWindow } from "@/shared/kernel/travel-window";
import { recommendDestinations, reachKm } from "../domain/destination-recommender";
import { FestivalRepository } from "../domain/festival";
import { DriveTimes, ORIGINS, originOf } from "../domain/origin";

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
  distanceKm: number;
  /** 「차로 약 2시간 10분」 — 길찾기를 못 하면 undefined */
  driveLabel?: string;
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
  driveTimes: DriveTimes,
): Promise<DestinationsView> {
  const window = TravelWindow.of(query.start, query.end);
  const origin = originOf(query.originId);
  const festivals = await repository.findOverlapping(window);
  const reach = reachKm(window.days);
  const destinations = recommendDestinations(festivals, window, origin.at);
  const minutes = await Promise.all(destinations.map((d) => driveTimes.minutes(origin.at, d.center)));

  return {
    originId: origin.id,
    originName: origin.name,
    origin: { lat: origin.at.lat, lng: origin.at.lng },
    origins: ORIGINS.map(({ id, name }) => ({ id, name })),
    reachKm: Number.isFinite(reach) ? reach : undefined,
    destinations: destinations.map((d, i) => ({
      code: d.region.code,
      name: d.region.name,
      center: { lat: d.center.lat, lng: d.center.lng },
      distanceKm: Math.round(d.distanceKm),
      driveLabel: minutes[i] === undefined ? undefined : `차로 ${durationLabel(minutes[i])}`,
      festivals: d.festivals.map((f) => ({
        id: f.id,
        title: f.title,
        dateLabel: rangeText(monthDay(f.start), monthDay(f.end)),
        address: f.address,
        imageUrl: f.imageUrl,
      })),
    })),
  };
}

const monthDay = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;
