import "server-only";
import { cacheFor } from "@/shared/cache";
import { Coordinate } from "@/shared/kernel/coordinate";
import { kakaoGet } from "./kakao-rest";

type DriveResult = { ok: true; minutes: number } | { ok: false };

/**
 * 카카오모빌리티 자동차 길찾기 — 걸리는 시간만 쓴다. 키(KAKAO_REST_API_KEY)는 서버에서만.
 * 좌표는 소수 4자리(약 10m)로 맞춰 캐시를 나눠 쓰지 않게 한다. 길은 잘 안 바뀌어 하루 캐시, 실패는 몇 분.
 */
async function fetchDriveMinutes(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<DriveResult> {
  "use cache";
  type Directions = { routes?: { result_code: number; summary?: { duration: number } }[] };
  const result = await kakaoGet<Directions>("kakao:directions", "https://apis-navi.kakaomobility.com/v1/directions", {
    origin: `${fromLng},${fromLat}`,
    destination: `${toLng},${toLat}`,
    priority: "RECOMMEND",
    summary: "true",
  });
  cacheFor(result.ok, "days", "minutes");
  if (!result.ok) return { ok: false };
  const route = result.data.routes?.[0];
  // 길이 없음(섬 등)·출발지와 도착지가 너무 가까움 — 실패가 아니라 「모름」이다.
  if (!route || route.result_code !== 0 || !route.summary) return { ok: false };
  return { ok: true, minutes: route.summary.duration / 60 };
}

const round = (n: number) => Math.round(n * 10_000) / 10_000;

/**
 * itinerary 의 DriveTimes 포트 구현.
 * 키가 없거나 실패하면 undefined — 화면은 직선 거리만 보여 준다.
 */
export class KakaoDriveTimes {
  async minutes(from: Coordinate, to: Coordinate): Promise<number | undefined> {
    const result = await fetchDriveMinutes(round(from.lat), round(from.lng), round(to.lat), round(to.lng));
    return result.ok ? result.minutes : undefined;
  }
}
