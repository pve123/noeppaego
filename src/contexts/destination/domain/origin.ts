import { Coordinate } from "@/shared/kernel/coordinate";

/** 출발지 — 특별·광역시와 세종, 그리고 도마다 큰 도시 하나(시청 근처). 제주는 바다를 건너 직선 거리가 맞지 않아 뺐다 */
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
  { id: "sejong", name: "세종", at: new Coordinate(36.48, 127.289) },
  { id: "chuncheon", name: "춘천", at: new Coordinate(37.8813, 127.7298) },
  { id: "cheongju", name: "청주", at: new Coordinate(36.6424, 127.489) },
  { id: "jeonju", name: "전주", at: new Coordinate(35.8242, 127.148) },
  { id: "changwon", name: "창원", at: new Coordinate(35.228, 128.6811) },
];

/** 모르는 id 면 서울 */
export function originOf(id: string | undefined): Origin {
  return ORIGINS.find((o) => o.id === id) ?? ORIGINS[0];
}
