import "server-only";
import { Coordinate } from "@/shared/kernel/coordinate";
import { TravelWindow } from "@/shared/kernel/travel-window";
import { unwrap } from "@/shared/public-data/public-data";
import {
  ContentType,
  fetchAreaItems,
  fetchFestivals,
  isoOf,
  latLngOf,
  regionOf,
  type TourItem,
} from "@/shared/tour-api/tour-api";
import { Place, PlaceCatalog, PlaceKind } from "../domain/place";
import { lodgingTypeOf } from "./lodging-types";

/** 관광공사 지역 조회로 장소를 고른다. 한 지역 볼거리는 관광지 40 + 문화시설 20 곳이면 3일 일정에 넉넉하다. */
export class TourPlaceCatalog implements PlaceCatalog {
  async regionName(regionCode: string): Promise<string | undefined> {
    const items = unwrap(await fetchAreaItems(regionCode, ContentType.sight, 40));
    return items.map(regionOf).find(Boolean)?.name;
  }

  async sightsIn(regionCode: string): Promise<Place[]> {
    const [sights, cultures] = await Promise.all([
      fetchAreaItems(regionCode, ContentType.sight, 40),
      fetchAreaItems(regionCode, ContentType.culture, 20),
    ]);
    // 관광지 사이사이에 문화시설을 섞는다 — 목록 앞쪽이 먼저 뽑힌다.
    return interleave(toPlaces(unwrap(sights), "sight"), toPlaces(unwrap(cultures), "culture"));
  }

  async festivalsIn(regionCode: string, window: TravelWindow): Promise<Place[]> {
    const compact = (iso: string) => iso.replaceAll("-", "");
    const items = unwrap(await fetchFestivals(compact(window.start), compact(window.end)));
    return items.flatMap((item) => {
      const start = isoOf(item.eventstartdate);
      const end = isoOf(item.eventenddate);
      if (regionOf(item)?.code !== regionCode || !start || !end) return [];
      return toPlaces([item], "festival").map((p) => ({ ...p, period: { start, end } }));
    });
  }

  /** 그 지역 숙소 — 분류로 고르는 순서와 종류(호텔·한옥·모텔 …)를 붙인다. 고를 몫이 넉넉하게 40곳 */
  async lodgingsIn(regionCode: string): Promise<Place[]> {
    return unwrap(await fetchAreaItems(regionCode, ContentType.lodging, 40)).flatMap((item) => {
      const type = lodgingTypeOf(item.lclsSystm3);
      return toPlaces([item], "lodging", type.label).map((p) => ({ ...p, rank: type.rank }));
    });
  }
}

const KIND_CATEGORY: Partial<Record<PlaceKind, string>> = {
  culture: "문화시설",
  festival: "축제·행사",
  lodging: "숙소",
};

export function toPlaces(items: TourItem[], kind: PlaceKind, category = KIND_CATEGORY[kind]): Place[] {
  return items.flatMap((item) => {
    const at = latLngOf(item);
    if (!at) return [];
    return [
      {
        id: `tour:${item.contentid}`,
        kind,
        title: item.title,
        location: new Coordinate(at.lat, at.lng),
        address: item.addr1,
        imageUrl: item.firstimage || undefined,
        category,
        indoor: kind === "culture",
      },
    ];
  });
}

function interleave<T>(main: T[], extra: T[], every = 3): T[] {
  const out: T[] = [];
  let e = 0;
  main.forEach((item, i) => {
    out.push(item);
    if ((i + 1) % every === 0 && e < extra.length) out.push(extra[e++]);
  });
  return [...out, ...extra.slice(e)];
}
