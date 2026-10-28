import { Coordinate } from "@/shared/kernel/coordinate";
import { TravelWindow } from "@/shared/kernel/travel-window";

export type PlaceKind = "sight" | "culture" | "festival" | "restaurant" | "cafe" | "lodging";

/**
 * 장소 성격 — 여행 취향과 맞춰 볼 때 쓴다(분류 코드에서 어림한다).
 * 볼거리: 자연(산·바다·생태·공원) · 역사 · 전시 · 교육 · 체험 · 테마파크 · 레저 · 랜드마크 · 쇼핑
 * 음식: 고기 · 해산물 · 매운 음식(못 먹는 음식을 뺄 때) / 숙소: 실속형(아이·부모님과 갈 때 뒤로)
 */
export type PlaceTag =
  | "nature"
  | "mountain"
  | "ocean"
  | "ecology"
  | "park"
  | "history"
  | "exhibit"
  | "education"
  | "activity"
  | "themepark"
  | "leisure"
  | "landmark"
  | "shopping"
  | "meat"
  | "seafood"
  | "spicy"
  | "budget";

/** 일정에 넣을 수 있는 장소 */
export type Place = {
  readonly id: string;
  readonly kind: PlaceKind;
  readonly title: string;
  readonly location: Coordinate;
  readonly address: string;
  readonly imageUrl?: string;
  /** 자세히 보기(카카오맵 장소 등) */
  readonly url?: string;
  /** 「한식」「카페」 같은 짧은 분류 */
  readonly category?: string;
  /** 실내 — 비 오는 날 바꿔 끼울 후보(3차 날씨 반영) */
  readonly indoor: boolean;
  /** 숙소를 고르는 순서 — 작을수록 먼저(호텔·한옥 0 … 모텔 3). 없으면 가운데로 본다 */
  readonly rank?: number;
  /** 축제 기간(YYYY-MM-DD) */
  readonly period?: { readonly start: string; readonly end: string };
  /** 장소 성격 — 없으면 취향과 상관없이 고른다 */
  readonly tags?: readonly PlaceTag[];
};

/** 포트 — 지역(법정동 시·도-시·군·구 코드)의 장소 */
export interface PlaceCatalog {
  regionName(regionCode: string): Promise<string | undefined>;
  /** 관광지·문화시설 — 볼거리 좋은 순(사진 있는 것부터) */
  sightsIn(regionCode: string): Promise<Place[]>;
  festivalsIn(regionCode: string, window: TravelWindow): Promise<Place[]>;
  lodgingsIn(regionCode: string): Promise<Place[]>;
}

/** 포트 — 좌표 근처 식당, 가까운 순 */
export interface RestaurantFinder {
  near(at: Coordinate, limit: number): Promise<Place[]>;
}

/** 포트 — 좌표 근처 카페·디저트 가게 */
export interface CafeFinder {
  near(at: Coordinate, limit: number): Promise<Place[]>;
}

/** 포트 — 장소 한 줄 소개. 없으면 undefined */
export interface PlaceIntros {
  introOf(place: Place): Promise<string | undefined>;
}

/** 포트 — 장소의 카카오맵 페이지(별점·리뷰를 보는 곳). 같은 곳을 못 찾으면 undefined */
export interface PlacePages {
  kakaoPageOf(place: Place): Promise<string | undefined>;
}

/** 근처 주차장 — 요금·빈자리는 모른다 */
export type ParkingLot = {
  readonly name: string;
  readonly address: string;
  readonly location: Coordinate;
  /** 기준 장소에서 직선 거리(m) */
  readonly distanceM: number;
};

/** 시설 자체 주차 안내 — 「가능(소형 150대)」처럼 기관이 적은 글 그대로 */
export type FacilityParking = { readonly text: string; readonly fee?: string };

/** 포트 — 장소(id·종류)의 시설 주차 안내. 안내가 없거나 모르는 장소면 undefined */
export interface FacilityParkingSource {
  parkingOf(placeId: string, kind: PlaceKind): Promise<FacilityParking | undefined>;
}

/** 포트 — 좌표 근처 주차장, 가까운 순. 못 찾거나 실패하면 빈 배열 */
export interface ParkingFinder {
  near(at: Coordinate): Promise<ParkingLot[]>;
}

/** 포트 — 자동차 이동 시간(분). 모르면 undefined */
export interface DriveTimes {
  minutes(from: Coordinate, to: Coordinate): Promise<number | undefined>;
}
