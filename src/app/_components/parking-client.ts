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

/** 시설 주차 안내를 받는 장소 — 관광공사 장소(tour:…)의 관광지·문화시설·숙소 */
export const hasFacilityParking = (placeId: string, kind?: string) =>
  placeId.startsWith("tour:") && (kind === "sight" || kind === "culture" || kind === "lodging");

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

/** 주차장으로 바로 길찾기 — 카카오맵 길찾기 링크(키 없이 앱·웹에서 열린다). 이름의 쉼표는 구분자와 겹쳐 뺀다 */
export const parkingRouteUrl = (lot: Pick<ParkingView, "name" | "lat" | "lng">) =>
  `https://map.kakao.com/link/to/${encodeURIComponent(lot.name.replaceAll(",", " "))},${lot.lat},${lot.lng}`;
