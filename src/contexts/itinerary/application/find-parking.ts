import { Coordinate } from "@/shared/kernel/coordinate";
import { FacilityParkingSource, ParkingFinder, PlaceKind } from "../domain/place";

/** 보여 줄 주차장 수 — 더 많으면 고르기만 어렵다 */
const SHOWN = 3;
/** 걷는 속도(m/분) — 시속 4km */
const WALK_M_PER_MIN = 67;
/** 주차장 분류에 섞여 드는 대행 업체(공항 주차대행 광고가 시청 주소로 올라온다) — 차를 댈 곳이 아니다 */
const NOT_A_LOT = /대행|발렛|발레/;

export type ParkingView = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** 「걸어서 2분」 — 사람은 거리보다 시간으로 판단한다 */
  walkMinutes: number;
};

/** 장소 근처 주차장(Query) — 가까운 순으로 몇 곳만. 대행 업체와 같은 이름은 뺀다 */
export async function findParking(at: Coordinate, finder: ParkingFinder): Promise<ParkingView[]> {
  const seen = new Set<string>();
  const lots = (await finder.near(at)).filter((lot) => {
    if (NOT_A_LOT.test(lot.name) || seen.has(lot.name)) return false;
    seen.add(lot.name);
    return true;
  });
  return lots.slice(0, SHOWN).map((lot) => ({
    name: lot.name,
    address: lot.address,
    lat: lot.location.lat,
    lng: lot.location.lng,
    walkMinutes: Math.max(1, Math.round(lot.distanceM / WALK_M_PER_MIN)),
  }));
}

export type FacilityParkingView = {
  text: string;
  fee?: string;
  /** 더 정확한 안내가 있는 곳(축제 홈페이지) */
  homepage?: string;
  /** 관광공사 글이 아니라 일반 안내 — 출처 줄을 달지 않는다 */
  general?: boolean;
};

/** 장소 자체 주차 안내(Query) — 관광공사 관광지·문화시설·숙소·식당·카페, 축제는 일반 안내와 홈페이지. 없으면 null */
export async function findFacilityParking(
  placeId: string,
  kind: PlaceKind,
  source: FacilityParkingSource,
): Promise<FacilityParkingView | null> {
  const found = await source.parkingOf(placeId, kind);
  return found ? { text: found.text, fee: found.fee, homepage: found.homepage, general: found.general } : null;
}
