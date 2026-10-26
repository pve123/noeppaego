import "server-only";
import { unwrap } from "@/shared/public-data/public-data";
import { Coordinate } from "../domain/coordinate";
import { Festival, FestivalRepository } from "../domain/festival";
import { TravelWindow } from "../domain/travel-window";
import { fetchFestivals, type FestivalItem } from "./tour-api-client";

/** 세종은 시·군·구가 없어 시·도 코드 하나로 온다 */
const SINGLE_TIER_REGIONS = new Set(["36110"]);

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
const toIso = (ymd: string) => `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;

/** 좌표·지역·날짜가 빠진 행사는 추천할 수 없어 버린다. */
function toFestival(item: FestivalItem): Festival | undefined {
  const lat = Number(item.mapy);
  const lng = Number(item.mapx);
  if (!lat || !lng || !item.lDongRegnCd || !/^\d{8}$/.test(item.eventstartdate) || !/^\d{8}$/.test(item.eventenddate)) {
    return undefined;
  }

  const single = SINGLE_TIER_REGIONS.has(item.lDongRegnCd);
  const words = item.addr1.trim().split(/\s+/);
  return {
    id: item.contentid,
    title: item.title,
    start: toIso(item.eventstartdate),
    end: toIso(item.eventenddate),
    location: new Coordinate(lat, lng),
    region: {
      code: single ? item.lDongRegnCd : `${item.lDongRegnCd}-${item.lDongSignguCd}`,
      // 지역 이름은 주소 앞부분(「부산광역시 해운대구」) — 코드표를 따로 묻지 않는다.
      name: words.slice(0, single ? 1 : 2).join(" "),
    },
    address: item.addr1,
    imageUrl: item.firstimage || undefined,
  };
}
