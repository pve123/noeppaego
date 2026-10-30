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
  // 기존 출발지에서 50km 넘게 떨어진 생활권 — 강원 남부·동해안, 경북 동해안, 전남 동부
  { id: "wonju", name: "원주", at: new Coordinate(37.3422, 127.9202) },
  { id: "gangneung", name: "강릉", at: new Coordinate(37.7519, 128.8761) },
  { id: "pohang", name: "포항", at: new Coordinate(36.019, 129.3435) },
  { id: "suncheon", name: "순천", at: new Coordinate(34.9507, 127.4872) },
];

/** 「내 위치」 출발지 id 의 머리 — `here:37.57,126.98` */
const HERE = "here:";
/** 소수 둘째 자리(약 1km)로 줄인다 — 거리 계산엔 충분하고, 주소·접속 기록에 정확한 위치가 남지 않는다 */
const roughly = (n: number) => Math.round(n * 100) / 100;
/** 우리나라 안만 — 바다 건너 엉뚱한 좌표로 추천하지 않게 */
const inKorea = (lat: number, lng: number) => lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;

/** 「내 위치」 출발지 — `here:위도,경도`. 형식이 틀리거나 우리나라 밖이면 undefined */
function hereOrigin(id: string | undefined): Origin | undefined {
  if (!id?.startsWith(HERE)) return undefined;
  const [lat, lng] = id.slice(HERE.length).split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inKorea(lat, lng)) return undefined;
  const at = new Coordinate(roughly(lat), roughly(lng));
  return { id: `${HERE}${at.lat},${at.lng}`, name: "내 위치", at };
}

/** 포트 — 좌표가 속한 동네 이름(「종로구」). 모르면 undefined */
export interface AreaNames {
  nameAt(at: Coordinate): Promise<string | undefined>;
}

/** 모르는 id 면 서울. `here:위도,경도` 면 내 위치 */
export function originOf(id: string | undefined): Origin {
  return hereOrigin(id) ?? ORIGINS.find((o) => o.id === id) ?? ORIGINS[0];
}
