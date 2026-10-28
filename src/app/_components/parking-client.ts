import type { ParkingView } from "@/contexts/itinerary";

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
