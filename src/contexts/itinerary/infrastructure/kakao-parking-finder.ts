import "server-only";
import { cacheLife } from "next/cache";
import { Coordinate } from "@/shared/kernel/coordinate";
import { ParkingFinder, ParkingLot } from "../domain/place";

/** 이보다 멀면 차를 대고 걷기에 멀다 */
const RADIUS_M = 500;

type KakaoParking = { place_name: string; road_address_name: string; address_name: string; x: string; y: string; distance: string };
/** 캐시에 넣는 모양 — `use cache` 는 클래스(Coordinate)를 담지 못해 평범한 객체로 둔다 */
type CachedLot = { name: string; address: string; lat: number; lng: number; distanceM: number };

/**
 * 카카오 로컬 주차장(PK6) 분류 검색, 거리순. 키(KAKAO_REST_API_KEY)는 서버에서만 쓴다.
 * 요금·빈자리는 주지 않는다. 같은 좌표는 몇 시간 캐시, 실패는 몇 초만.
 */
async function searchKakaoParking(lat: number, lng: number): Promise<CachedLot[]> {
  "use cache";
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    cacheLife("seconds");
    return [];
  }
  const url = new URL("https://dapi.kakao.com/v2/local/search/category.json");
  url.searchParams.set("category_group_code", "PK6");
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));
  url.searchParams.set("radius", String(RADIUS_M));
  url.searchParams.set("sort", "distance");
  url.searchParams.set("size", "15"); // 대행 업체를 거르고도 세 곳이 남게
  try {
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(5_000) });
    if (!res.ok) {
      console.warn(`[kakao:parking] 응답 ${res.status}`);
      cacheLife("seconds");
      return [];
    }
    const { documents } = (await res.json()) as { documents: KakaoParking[] };
    cacheLife("hours");
    return documents.map((d) => ({
      name: d.place_name,
      address: d.road_address_name || d.address_name,
      lat: Number(d.y),
      lng: Number(d.x),
      distanceM: Number(d.distance) || 0,
    }));
  } catch (e) {
    console.warn(`[kakao:parking] 연결 실패: ${(e as Error).name}`);
    cacheLife("seconds");
    return [];
  }
}

export class KakaoParkingFinder implements ParkingFinder {
  async near(at: Coordinate): Promise<ParkingLot[]> {
    // 소수 넷째 자리(약 10m)로 맞춰 같은 장소는 캐시를 같이 쓴다
    const lots = await searchKakaoParking(Math.round(at.lat * 1e4) / 1e4, Math.round(at.lng * 1e4) / 1e4);
    return lots.map(({ lat, lng, ...lot }) => ({ ...lot, location: new Coordinate(lat, lng) }));
  }
}
