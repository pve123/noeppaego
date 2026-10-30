import "server-only";
import { cacheLife } from "next/cache";
import { Coordinate } from "@/shared/kernel/coordinate";
import { kakaoGet } from "@/shared/kakao/kakao-rest";
import { ContentType, fetchNearbyItems } from "@/shared/tour-api/tour-api";
import { CafeFinder, Place, RestaurantFinder } from "../domain/place";
import { foodTagsOf } from "./place-tags";
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
        const code = item.lclsSystm3?.slice(0, 4) ?? "";
        const category = TOUR_FOOD_CATEGORY[code];
        if (category === null) return [];
        // 관광공사 분류에는 고기·해산물이 없다 — 상호로 어림한다
        return toPlaces([item], "restaurant", category ?? "음식점").map((p) => ({ ...p, tags: foodTagsOf("", p.title) }));
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
  const { code, keyword } = KAKAO_GROUP[group];
  const result = await kakaoGet<{ documents: KakaoPlace[] }>(
    "kakao:local",
    `https://dapi.kakao.com/v2/local/search/${by === "popular" ? "keyword" : "category"}.json`,
    {
      ...(by === "popular" ? { query: keyword } : {}),
      category_group_code: code,
      x: lng,
      y: lat,
      radius: RADIUS_M,
      sort: by === "popular" ? "accuracy" : "distance",
      size: 15,
    },
  );
  if (result.ok) cacheLife("hours");
  else cacheLife("seconds");
  return result.ok ? { ok: true, places: result.data.documents } : { ok: false };
}

/** 많이 찾는 곳이 이보다 적으면 가까운 곳으로 채운다 — 고를 곳 하나 + 바꿀 후보 둘 + 여유 하나 */
const ENOUGH = 4;

/**
 * 카카오에서 많이 찾는 곳부터 고를 후보 — fits(끼니인지 등)에 맞고 체인 지점이 아닌 곳.
 * 모자라면 가까운 곳으로 채우고, 거르고 나서 하나도 없으면 fits 만 맞는 곳(체인 지점 포함)이라도.
 * 카카오가 실패했거나 그것도 없으면 undefined — 다른 방법(fallback)을 쓰라는 뜻(칸을 비우지 않는다).
 */
async function kakaoPicks(at: Coordinate, group: keyof typeof KAKAO_GROUP, fits: (p: KakaoPlace) => boolean): Promise<KakaoPlace[] | undefined> {
  const popular = await searchKakaoPlaces(at.lat, at.lng, group, "popular");
  if (!popular.ok) return undefined;

  const fitting = popular.places.filter(fits);
  let picks = fitting.filter((p) => !isChainBranch(p.place_name));
  if (picks.length < ENOUGH) {
    const nearby = await searchKakaoPlaces(at.lat, at.lng, group, "nearby");
    const seen = new Set(picks.map((p) => p.id));
    const more = nearby.ok ? nearby.places.filter((p) => fits(p) && !isChainBranch(p.place_name) && !seen.has(p.id)) : [];
    picks = [...picks, ...more];
  }
  if (picks.length === 0) picks = fitting;
  return picks.length > 0 ? picks : undefined;
}

const toPlace = (p: KakaoPlace, kind: "restaurant" | "cafe", category: string, tags?: Place["tags"]): Place => ({
  id: `kakao:${p.id}`,
  kind,
  title: p.place_name,
  location: new Coordinate(Number(p.y), Number(p.x)),
  address: p.road_address_name || p.address_name,
  url: p.place_url,
  category,
  indoor: true,
  tags,
});

export class KakaoRestaurantFinder implements RestaurantFinder {
  /** 카카오가 실패하면 쓸 다른 방법 */
  constructor(private readonly fallback: RestaurantFinder) {}

  /**
   * 많이 찾는 집부터, 끼니가 아닌 곳(빵집·디저트·술집·카페)과 체인 지점은 빼고 넘긴다.
   * 그중 어디를 고를지는 도메인(fillMeals)이 식사 칸에서 가까운 순으로 정한다 — 「많이 찾는 집 중 가까운 곳」.
   * 고기·해산물·매운 음식은 tags 로 붙인다(못 먹는 음식을 뺄 때 쓴다).
   */
  async near(at: Coordinate, limit: number): Promise<Place[]> {
    const picks = await kakaoPicks(at, "restaurant", (p) => isMeal(p.category_name));
    if (!picks) return this.fallback.near(at, limit); // 관광공사 음식점이라도 — 식사 칸을 비우지 않는다
    return picks.slice(0, limit).map((p) =>
      // 「음식점 > 한식 > 해장국」 → 「해장국」
      toPlace(p, "restaurant", p.category_name.split(">").at(-1)?.trim() || "음식점", foodTagsOf(p.category_name, p.place_name)),
    );
  }
}

export class KakaoCafeFinder implements CafeFinder {
  /** 카카오가 실패하면 쓸 다른 방법 */
  constructor(private readonly fallback: CafeFinder) {}

  /** 많이 찾는 카페부터, 체인 지점은 빼고 넘긴다 — 그 동네에서만 갈 수 있는 곳이 낫다. 고르는 건 도메인(fillMeals) */
  async near(at: Coordinate, limit: number): Promise<Place[]> {
    const picks = await kakaoPicks(at, "cafe", () => true);
    if (!picks) return this.fallback.near(at, limit);
    return picks.slice(0, limit).map((p) => toPlace(p, "cafe", cafeCategoryOf(p.category_name)));
  }
}
