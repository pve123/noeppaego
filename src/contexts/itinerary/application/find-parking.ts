import { Coordinate } from "@/shared/kernel/coordinate";
import { ParkingFinder } from "../domain/place";

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
