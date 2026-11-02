import type { FacilityParkingView, ParkingView } from "@/contexts/itinerary";

/** 같은 좌표는 한 번만 묻는다 — 카드의 주차 시트와 지도의 주차장 보기가 함께 쓴다. 실패하면 다음에 다시 묻는다 */
const asked = new Map<string, Promise<ParkingView[]>>();

export function fetchParking(lat: number, lng: number): Promise<ParkingView[]> {
  const key = `${lat},${lng}`;
  let found = asked.get(key);
  if (!found) {
    found = fetch(`/api/parking?lat=${lat}&lng=${lng}`).then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      return res.json() as Promise<ParkingView[]>;
    });
    found.catch(() => asked.delete(key));
    asked.set(key, found);
  }
  return found;
}

/** 장소 자체 주차 안내를 받는 종류 — 관광공사 장소(tour:…)만 */
const FACILITY_KINDS = new Set(["sight", "culture", "lodging", "restaurant", "cafe", "festival"]);
export const hasFacilityParking = (placeId: string, kind?: string) => placeId.startsWith("tour:") && !!kind && FACILITY_KINDS.has(kind);

const facility = new Map<string, Promise<FacilityParkingView | null>>();

/** 장소 자체 주차 안내 — 실패하면 없는 것으로 보고(근처 주차장은 그대로 보인다) 다음에 다시 묻는다 */
export function fetchFacilityParking(placeId: string, kind: string): Promise<FacilityParkingView | null> {
  const key = `${placeId}|${kind}`;
  let found = facility.get(key);
  if (!found) {
    found = fetch(`/api/parking/facility?id=${encodeURIComponent(placeId)}&kind=${kind}`)
      .then((res) => (res.ok ? (res.json() as Promise<FacilityParkingView | null>) : Promise.reject(new Error(String(res.status)))))
      .catch(() => {
        facility.delete(key);
        return null;
      });
    facility.set(key, found);
  }
  return found;
}
