import "server-only";
import { cacheLife } from "next/cache";
import { Coordinate } from "@/shared/kernel/coordinate";
import { ContentType, fetchNearbyItems } from "@/shared/tour-api/tour-api";
import { CafeFinder, Place, RestaurantFinder } from "../domain/place";
import { cafeCategoryOf, isChainBranch, isMeal } from "./restaurant-filters";
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

/** 관광공사 음식점 중 카페(FD05)만 */
export class TourCafeFinder implements CafeFinder {
  async near(at: Coordinate, limit: number): Promise<Place[]> {
    const result = await fetchNearbyItems(at.lat, at.lng, RADIUS_M, ContentType.restaurant, limit * 3);
    if (!result.ok) return []; // 카페가 없어도 일정은 보여 준다 — 실패는 tour-api 가 warn 으로 남겼다
    return toPlaces(result.value.filter((item) => item.lclsSystm3?.startsWith("FD05")), "cafe", "카페").slice(0, limit);
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

/** 카카오 분류 — 음식점(FD6)은 「맛집」, 카페(CE7)는 「카페」로 많이 찾는 곳을 고른다 */
const KAKAO_GROUP = {
  restaurant: { code: "FD6", keyword: "맛집" },
  cafe: { code: "CE7", keyword: "카페" },
} as const;

/**
 * 카카오 로컬 음식점·카페 검색. 키(KAKAO_REST_API_KEY)는 서버에서만 쓴다.
 * - `popular`: 「맛집」「카페」 키워드·정확도순 — 카카오가 많이 찾는 곳을 위로 올린다
 * - `nearby`: 분류 검색·거리순 — 많이 찾는 곳이 모자랄 때 채운다
 * 카카오 장소 정보는 오래 쌓아 두지 않는다 — 몇 시간만 캐시. 실패는 몇 초만.
 */
async function searchKakaoPlaces(
  lat: number,
  lng: number,
  group: keyof typeof KAKAO_GROUP,
  by: "popular" | "nearby",
): Promise<KakaoResult> {
  "use cache";
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    cacheLife("seconds");
    return { ok: false };
  }

  const { code, keyword } = KAKAO_GROUP[group];
  const url = new URL(`https://dapi.kakao.com/v2/local/search/${by === "popular" ? "keyword" : "category"}.json`);
  if (by === "popular") url.searchParams.set("query", keyword);
  url.searchParams.set("category_group_code", code);
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));
  url.searchParams.set("radius", String(RADIUS_M));
  url.searchParams.set("sort", by === "popular" ? "accuracy" : "distance");
  url.searchParams.set("size", "15");

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

/** 맛집 결과가 이보다 적으면 가까운 식당으로 채운다 — 고를 곳 하나 + 바꿀 후보 둘 + 여유 하나 */
const ENOUGH = 4;

export class KakaoRestaurantFinder implements RestaurantFinder {
  /** 카카오가 실패하면 쓸 다른 방법 */
  constructor(private readonly fallback: RestaurantFinder) {}

  /**
   * 많이 찾는 집부터, 끼니가 아닌 곳(빵집·디저트·술집·카페)과 체인 지점은 빼고 넘긴다.
   * 그중 어디를 고를지는 도메인(fillMeals)이 식사 칸에서 가까운 순으로 정한다 — 「많이 찾는 집 중 가까운 곳」.
   * 거르고 나서 하나도 없으면 거르기 전 목록을, 그것도 없으면 다른 방법(fallback)을 쓴다(식사 칸을 비우지 않는다).
   */
  async near(at: Coordinate, limit: number): Promise<Place[]> {
    const popular = await searchKakaoPlaces(at.lat, at.lng, "restaurant", "popular");
    if (!popular.ok) return this.fallback.near(at, limit);

    const meals = popular.places.filter((p) => isMeal(p.category_name));
    let picks = meals.filter((p) => !isChainBranch(p.place_name));
    if (picks.length < ENOUGH) {
      const nearby = await searchKakaoPlaces(at.lat, at.lng, "restaurant", "nearby");
      const seen = new Set(picks.map((p) => p.id));
      const more = nearby.ok ? nearby.places.filter((p) => isMeal(p.category_name) && !isChainBranch(p.place_name) && !seen.has(p.id)) : [];
      picks = [...picks, ...more];
    }
    if (picks.length === 0) picks = meals;
    // 카카오에 근처 식당이 하나도 없으면 관광공사 음식점이라도 — 식사 칸을 비우지 않는다
    if (picks.length === 0) return this.fallback.near(at, limit);

    return picks
      .slice(0, limit)
      .map((p) => ({
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

export class KakaoCafeFinder implements CafeFinder {
  /** 카카오가 실패하면 쓸 다른 방법 */
  constructor(private readonly fallback: CafeFinder) {}

  /**
   * 많이 찾는 카페부터, 체인 지점은 빼고 넘긴다 — 그 동네에서만 갈 수 있는 곳이 낫다.
   * 어디를 고를지는 도메인(fillMeals)이 카페 칸에서 가까운 순으로 정한다.
   * 거르고 나서 하나도 없으면 체인 지점이라도, 그것도 없으면 다른 방법(fallback)을 쓴다.
   */
  async near(at: Coordinate, limit: number): Promise<Place[]> {
    const popular = await searchKakaoPlaces(at.lat, at.lng, "cafe", "popular");
    if (!popular.ok) return this.fallback.near(at, limit);

    let picks = popular.places.filter((p) => !isChainBranch(p.place_name));
    if (picks.length < ENOUGH) {
      const nearby = await searchKakaoPlaces(at.lat, at.lng, "cafe", "nearby");
      const seen = new Set(picks.map((p) => p.id));
      const more = nearby.ok ? nearby.places.filter((p) => !isChainBranch(p.place_name) && !seen.has(p.id)) : [];
      picks = [...picks, ...more];
    }
    if (picks.length === 0) picks = popular.places;
    if (picks.length === 0) return this.fallback.near(at, limit);

    return picks.slice(0, limit).map((p) => ({
      id: `kakao:${p.id}`,
      kind: "cafe",
      title: p.place_name,
      location: new Coordinate(Number(p.y), Number(p.x)),
      address: p.road_address_name || p.address_name,
      url: p.place_url,
      category: cafeCategoryOf(p.category_name),
      indoor: true,
    }));
  }
}
