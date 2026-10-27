import { Coordinate } from "@/shared/kernel/coordinate";

/** 출발지 — 시·도 대표 도시의 시청 근처 */
export type Origin = {
  readonly id: string;
  readonly name: string;
  readonly at: Coordinate;
};

export const ORIGINS: readonly Origin[] = [
  { id: "seoul", name: "서울", at: new Coordinate(37.5665, 126.978) },
  { id: "incheon", name: "인천", at: new Coordinate(37.4563, 126.7052) },
  { id: "suwon", name: "수원", at: new Coordinate(37.2636, 127.0286) },
  { id: "daejeon", name: "대전", at: new Coordinate(36.3504, 127.3845) },
  { id: "daegu", name: "대구", at: new Coordinate(35.8714, 128.6014) },
  { id: "gwangju", name: "광주", at: new Coordinate(35.1595, 126.8526) },
  { id: "busan", name: "부산", at: new Coordinate(35.1796, 129.0756) },
  { id: "ulsan", name: "울산", at: new Coordinate(35.5384, 129.3114) },
];

/** 모르는 id 면 서울 */
export function originOf(id: string | undefined): Origin {
  return ORIGINS.find((o) => o.id === id) ?? ORIGINS[0];
}
