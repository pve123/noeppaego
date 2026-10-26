/**
 * 저장한 일정(애그리거트 루트) — 그 순간 짠 일정을 통째로(snapshot) 둔다.
 * snapshot 은 읽기 모델 그대로라 도메인은 모양을 모른다. 크기만 지킨다.
 */
export type SavedItinerary = {
  readonly id: string;
  readonly ownerId: string;
  readonly breakStart: string;
  readonly regionCode: string;
  /** 사용자가 바꾼 칸 — 「이 일정으로 다시 짜기」 */
  readonly picks: Readonly<Record<string, string>>;
  readonly snapshot: Readonly<Record<string, unknown>>;
  readonly createdAt?: Date;
};

/** 주소에 쓰는 id — 영문·숫자 10자 */
export const SAVED_ID = /^[0-9A-Za-z]{10}$/;

/** 일정 하나는 수십 KB 다. 이보다 크면 뭔가 잘못 들어온 것 */
export const MAX_SNAPSHOT_BYTES = 200_000;

export function assertSnapshotSize(snapshot: Readonly<Record<string, unknown>>): void {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot)).length;
  if (bytes > MAX_SNAPSHOT_BYTES) throw new Error(`저장할 일정이 너무 큽니다: ${bytes}B`);
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
}
