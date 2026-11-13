/**
 * 저장한 일정(애그리거트 루트).
 * 장소는 두지 않고 일정을 다시 짤 재료(recipe)만 둔다. 열 때마다 이 재료로 일정을 새로 짠다.
 * 재료의 모양은 application 이 정하고 도메인은 크기만 지킨다.
 */
export type SavedItinerary = {
  readonly id: string;
  readonly ownerId: string;
  readonly breakStart: string;
  readonly regionCode: string;
  /** 사용자가 바꾼 칸 — 「이 일정으로 다시 짜기」 */
  readonly picks: Readonly<Record<string, string>>;
  readonly recipe: Readonly<Record<string, unknown>>;
  readonly createdAt?: Date;
};

/** 주소에 쓰는 id — 영문·숫자 10자 */
export const SAVED_ID = /^[0-9A-Za-z]{10}$/;

/** 재료는 연휴 이름과 날짜와 지역 이름과 취향뿐이라 1KB 도 안 된다. 이보다 크면 뭔가 잘못 들어온 것 */
export const MAX_RECIPE_BYTES = 8_000;

export function assertRecipeSize(recipe: Readonly<Record<string, unknown>>): void {
  const bytes = new TextEncoder().encode(JSON.stringify(recipe)).length;
  if (bytes > MAX_RECIPE_BYTES) throw new Error(`저장할 일정이 너무 큽니다: ${bytes}B`);
}

export type FavoriteEntry = {
  readonly itinerary: SavedItinerary;
  readonly favoritedAt: Date;
};

/** 포트 */
export interface SavedItineraryRepository {
  save(itinerary: SavedItinerary): Promise<void>;
  find(id: string): Promise<SavedItinerary | undefined>;
  addFavorite(userId: string, itineraryId: string): Promise<void>;
  removeFavorite(userId: string, itineraryId: string): Promise<void>;
  isFavorite(userId: string, itineraryId: string): Promise<boolean>;
  /** 찜한 순서 거꾸로(최근 것부터) */
  listFavorites(userId: string): Promise<FavoriteEntry[]>;
  /** 탈퇴 — 이 사람이 저장한 일정(다른 사람이 그 일정에 한 찜까지)과 이 사람의 찜을 한꺼번에 지운다 */
  deleteAllOf(userId: string): Promise<void>;
}
