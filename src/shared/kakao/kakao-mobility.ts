import "server-only";
import { cacheLife } from "next/cache";
import { Coordinate } from "@/shared/kernel/coordinate";

type DriveResult = { ok: true; minutes: number } | { ok: false };

/**
 * 카카오모빌리티 자동차 길찾기 — 걸리는 시간만 쓴다. 키(KAKAO_REST_API_KEY)는 서버에서만.
 * 좌표는 소수 4자리(약 10m)로 맞춰 캐시를 나눠 쓰지 않게 한다. 길은 잘 안 바뀌어 하루 캐시, 실패는 몇 분.
 */
async function fetchDriveMinutes(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<DriveResult> {
  "use cache";
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    cacheLife("seconds");
    return { ok: false };
  }

  const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
  url.searchParams.set("origin", `${fromLng},${fromLat}`);
  url.searchParams.set("destination", `${toLng},${toLat}`);
  url.searchParams.set("priority", "RECOMMEND");
  url.searchParams.set("summary", "true");

  try {
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(5_000) });
    if (!res.ok) {
      console.warn(`[kakao:directions] 응답 ${res.status}`);
      cacheLife("minutes");
      return { ok: false };
    }
    const json = (await res.json()) as { routes?: { result_code: number; summary?: { duration: number } }[] };
    const route = json.routes?.[0];
    if (!route || route.result_code !== 0 || !route.summary) {
      // 길이 없음(섬 등)·출발지와 도착지가 너무 가까움 — 실패가 아니라 「모름」이다.
      cacheLife("days");
      return { ok: false };
    }
    cacheLife("days");
    return { ok: true, minutes: route.summary.duration / 60 };
  } catch (e) {
    console.warn(`[kakao:directions] 연결 실패: ${(e as Error).name}`);
    cacheLife("minutes");
    return { ok: false };
  }
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
