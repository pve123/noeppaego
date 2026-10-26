import "server-only";
import { Coordinate } from "@/shared/kernel/coordinate";
import { unwrap } from "@/shared/public-data/public-data";
import { fetchFestivals, isoOf, latLngOf, regionOf, type FestivalItem } from "@/shared/tour-api/tour-api";
import { Festival, FestivalRepository } from "../domain/festival";
import { TravelWindow } from "@/shared/kernel/travel-window";

export class TourFestivalRepository implements FestivalRepository {
  async findOverlapping(window: TravelWindow): Promise<Festival[]> {
    const items = unwrap(await fetchFestivals(compact(window.start), compact(window.end)));
    return items.flatMap((item) => {
      const festival = toFestival(item);
      return festival ? [festival] : [];
    });
  }
}

const compact = (iso: string) => iso.replaceAll("-", "");

/** 좌표·지역·날짜가 빠진 행사는 추천할 수 없어 버린다. */
function toFestival(item: FestivalItem): Festival | undefined {
  const at = latLngOf(item);
  const region = regionOf(item);
  const start = isoOf(item.eventstartdate);
  const end = isoOf(item.eventenddate);
  if (!at || !region || !start || !end) return undefined;
  return {
    id: item.contentid,
    title: item.title,
    start,
    end,
    location: new Coordinate(at.lat, at.lng),
    region,
    address: item.addr1,
    imageUrl: item.firstimage || undefined,
  };
}
