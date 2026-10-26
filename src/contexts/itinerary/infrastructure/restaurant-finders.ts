import "server-only";
import { cacheLife } from "next/cache";
import { Coordinate } from "@/shared/kernel/coordinate";
import { ContentType, fetchNearbyItems } from "@/shared/tour-api/tour-api";
import { Place, RestaurantFinder } from "../domain/place";
import { toPlaces } from "./tour-place-catalog";

const RADIUS_M = 2_000;

// ── 관광공사 음식점(키 하나로 되는 기본) ───────────────────

/** 관광공사 신분류(lclsSystm3) 앞 4자리 → 짧은 분류. 카페·주점은 끼니로 고르지 않는다. */
const TOUR_FOOD_CATEGORY: Record<string, string | null> = {
  FD01: "한식",
  FD02: "외국 음식",
  FD03: "간편식",
  FD04: null, // 주점
  FD05: null, // 카페
};

export class TourRestaurantFinder implements RestaurantFinder {
  async near(at: Coordinate, limit: number): Promise<Place[]> {
    const result = await fetchNearbyItems(at.lat, at.lng, RADIUS_M, ContentType.restaurant, limit * 2);
    if (!result.ok) return []; // 맛집이 없어도 일정은 보여 준다 — 실패는 tour-api 가 warn 으로 남겼다
    return result.value
      .flatMap((item) => {
        const category = TOUR_FOOD_CATEGORY[item.lclsSystm3?.slice(0, 4) ?? ""];
        return category === null ? [] : toPlaces([item], "restaurant", category ?? "음식점");
      })
      .slice(0, limit);
  }
}

// ── 카카오 로컬(REST 키가 있을 때) ───────────────────────

type KakaoPlace = {
  id: string;
  place_name: string;
  category_name: string;
  road_address_name: string;
  address_name: string;
  x: string;
  y: string;
  place_url: string;
};
type KakaoResult = { ok: true; places: KakaoPlace[] } | { ok: false };

/**
 * 카카오 로컬 카테고리 검색(음식점 FD6) — 거리순. 키(KAKAO_REST_API_KEY)는 서버에서만 쓴다.
 * 카카오 장소 정보는 오래 쌓아 두지 않는다 — 몇 시간만 캐시. 실패는 몇 초만.
 */
async function searchKakaoRestaurants(lat: number, lng: number, size: number): Promise<KakaoResult> {
  "use cache";
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    cacheLife("seconds");
    return { ok: false };
  }

  const url = new URL("https://dapi.kakao.com/v2/local/search/category.json");
  url.searchParams.set("category_group_code", "FD6");
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));
  url.searchParams.set("radius", String(RADIUS_M));
  url.searchParams.set("sort", "distance");
  url.searchParams.set("size", String(Math.min(size, 15)));

  try {
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(5_000) });
    if (!res.ok) {
      console.warn(`[kakao:local] 응답 ${res.status}`);
      cacheLife("seconds");
      return { ok: false };
    }
    const json = (await res.json()) as { documents: KakaoPlace[] };
    cacheLife("hours");
    return { ok: true, places: json.documents };
  } catch (e) {
    console.warn(`[kakao:local] 연결 실패: ${(e as Error).name}`);
    cacheLife("seconds");
    return { ok: false };
  }
}

export class KakaoRestaurantFinder implements RestaurantFinder {
  /** 카카오가 실패하면 쓸 다른 방법 */
  constructor(private readonly fallback: RestaurantFinder) {}

  async near(at: Coordinate, limit: number): Promise<Place[]> {
    const result = await searchKakaoRestaurants(at.lat, at.lng, limit);
    if (!result.ok) return this.fallback.near(at, limit);
    return result.places.map((p) => ({
      id: `kakao:${p.id}`,
      kind: "restaurant",
      title: p.place_name,
      location: new Coordinate(Number(p.y), Number(p.x)),
      address: p.road_address_name || p.address_name,
      url: p.place_url,
      // 「음식점 > 한식 > 해장국」 → 「해장국」
      category: p.category_name.split(">").at(-1)?.trim() || "음식점",
      indoor: true,
    }));
  }
}
