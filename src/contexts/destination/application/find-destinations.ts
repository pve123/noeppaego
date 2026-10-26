import { Coordinate, SEOUL } from "../domain/coordinate";
import { recommendDestinations, reachKm } from "../domain/destination-recommender";
import { FestivalRepository } from "../domain/festival";
import { TravelWindow } from "../domain/travel-window";

// ── 쿼리 ─────────────────────────────────────────────

export type FindDestinations = {
  /** YYYY-MM-DD */
  start: string;
  end: string;
};

// ── 읽기 모델 ─────────────────────────────────────────

export type FestivalView = {
  id: string;
  title: string;
  dateLabel: string;
  address: string;
  imageUrl?: string;
};

export type DestinationView = {
  code: string;
  name: string;
  distanceKm: number;
  festivals: FestivalView[];
};

export type DestinationsView = {
  originName: string;
  /** 「서울에서 400km 안」 같은 거리 안내. 제한이 없으면 undefined */
  reachKm?: number;
  destinations: DestinationView[];
};

// ── 핸들러 ────────────────────────────────────────────

const ORIGIN: { name: string; at: Coordinate } = { name: "서울", at: SEOUL };

export async function findDestinations(
  query: FindDestinations,
  repository: FestivalRepository,
): Promise<DestinationsView> {
  const window = TravelWindow.of(query.start, query.end);
  const festivals = await repository.findOverlapping(window);
  const reach = reachKm(window.days);

  return {
    originName: ORIGIN.name,
    reachKm: Number.isFinite(reach) ? reach : undefined,
    destinations: recommendDestinations(festivals, window, ORIGIN.at).map((d) => ({
      code: d.region.code,
      name: d.region.name,
      distanceKm: Math.round(d.distanceKm),
      festivals: d.festivals.map((f) => ({
        id: f.id,
        title: f.title,
        dateLabel: `${monthDay(f.start)} – ${monthDay(f.end)}`,
        address: f.address,
        imageUrl: f.imageUrl,
      })),
    })),
  };
}

const monthDay = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;
