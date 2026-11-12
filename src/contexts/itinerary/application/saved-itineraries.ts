import { rangeText } from "@/shared/kernel/korean";
import { addDays, dotDate } from "@/shared/kernel/travel-window";
import { assertSnapshotSize, SAVED_ID, SavedItineraryRepository } from "../domain/saved-itinerary";
import type { TripPrefs } from "../domain/preferences";
import { ItineraryView } from "./plan-itinerary";

/**
 * 저장하는 내용 — 일정을 다시 짤 재료(연휴 끝날·여행 취향)와 목록·미리보기에 쓰는 제목뿐이다.
 * 장소는 저장하지 않고 열 때마다 다시 짠다. 카카오 장소 정보는 임시 캐시 말고는 보관하면 안 되기 때문이다.
 * 제목(지역 이름·기간)은 관광공사 지역 이름과 우리가 계산한 날짜라 남겨도 된다.
 */
export type ItinerarySnapshot = {
  breakTitle: string;
  /** 연휴 끝날(YYYY-MM-DD) — 일정을 다시 짤 때 쓴다 */
  breakEnd: string;
  regionName: string;
  /** 「2박 3일」 */
  lengthLabel: string;
  startLabel: string;
  endLabel: string;
  /** 여행 취향을 골랐을 때만 */
  prefs?: TripPrefs;
};

/** 예전 저장 방식 — 일정 읽기 모델을 통째로 담았다. 읽을 때 제목만 꺼내고 장소는 쓰지 않는다 */
type LegacySnapshot = { breakTitle: string; plan: ItineraryView; prefs?: TripPrefs };

/** 저장한 snapshot → 지금 모양. 예전 모양이면 일정 날수로 끝날을 어림한다(최대 MAX_TRIP_DAYS 만 짜므로 같은 날들이 나온다) */
export function snapshotOf(raw: Readonly<Record<string, unknown>>, breakStart: string): ItinerarySnapshot {
  if (!("plan" in raw)) return raw as unknown as ItinerarySnapshot;
  const { breakTitle, plan, prefs } = raw as unknown as LegacySnapshot;
  return {
    breakTitle,
    breakEnd: addDays(breakStart, Math.max(plan.days.length, 1) - 1),
    regionName: plan.regionName,
    lengthLabel: plan.lengthLabel,
    startLabel: plan.startLabel,
    endLabel: plan.endLabel,
    prefs,
  };
}

// ── Command ──────────────────────────────────────────

export type SaveItinerary = {
  ownerId: string;
  breakStart: string;
  regionCode: string;
  picks: Record<string, string>;
  snapshot: ItinerarySnapshot;
};

/** 일정 저장 — 저장한 사람의 찜에도 넣는다. 새 id 를 돌려준다. */
export async function saveItinerary(
  command: SaveItinerary,
  repository: SavedItineraryRepository,
  newId: () => string,
): Promise<string> {
  const snapshot = command.snapshot as unknown as Record<string, unknown>;
  assertSnapshotSize(snapshot);
  const id = newId();
  await repository.save({ id, ownerId: command.ownerId, breakStart: command.breakStart, regionCode: command.regionCode, picks: command.picks, snapshot });
  await repository.addFavorite(command.ownerId, id);
  return id;
}

/** 찜하기·찜 풀기 — 없는 일정은 찜하지 않는다. 찜했으면 true */
export async function toggleFavorite(
  command: { userId: string; itineraryId: string; favorite: boolean },
  repository: SavedItineraryRepository,
): Promise<boolean> {
  if (!SAVED_ID.test(command.itineraryId)) return false;
  if (!command.favorite) {
    await repository.removeFavorite(command.userId, command.itineraryId);
    return false;
  }
  if (!(await repository.find(command.itineraryId))) return false;
  await repository.addFavorite(command.userId, command.itineraryId);
  return true;
}

/**
 * 탈퇴한 사람의 일정 지우기 — 저장한 일정은 공유 링크도 함께 사라진다(다른 사람이 찜해 뒀어도).
 * 일정에는 개인 정보가 없지만, 탈퇴하면 남기지 않는 쪽이 사용자가 기대하는 것이다.
 */
export async function forgetItinerariesOf(userId: string, repository: SavedItineraryRepository): Promise<void> {
  await repository.deleteAllOf(userId);
}

// ── Query ────────────────────────────────────────────

export type SavedItineraryView = ItinerarySnapshot & {
  id: string;
  /** 「2026.10.26」 — 저장한 날(한국) */
  savedOn: string;
  /** 「이 일정으로 다시 짜기」 주소 재료 */
  breakStart: string;
  regionCode: string;
  picks: Record<string, string>;
  /** 보는 사람이 찜했는지 — 로그인 안 했으면 false */
  favorite: boolean;
  /** 보는 사람이 저장한 일정인지 */
  mine: boolean;
};

export async function findSavedItinerary(
  query: { id: string; viewerId?: string },
  repository: SavedItineraryRepository,
): Promise<SavedItineraryView | undefined> {
  if (!SAVED_ID.test(query.id)) return undefined;
  const saved = await repository.find(query.id);
  if (!saved) return undefined;
  return {
    ...snapshotOf(saved.snapshot, saved.breakStart),
    id: saved.id,
    savedOn: kstDate(saved.createdAt),
    breakStart: saved.breakStart,
    regionCode: saved.regionCode,
    picks: { ...saved.picks },
    favorite: query.viewerId ? await repository.isFavorite(query.viewerId, saved.id) : false,
    mine: saved.ownerId === query.viewerId,
  };
}

type FavoriteView = {
  id: string;
  breakTitle: string;
  /** 「경기도 파주시 2박 3일」 */
  title: string;
  /** 「2026.12.25(금)부터 2026.12.27(일)까지」 */
  period: string;
  savedOn: string;
  /** 내가 저장한 일정인지 — 탈퇴하면 공유 링크까지 사라지는 일정 */
  mine: boolean;
};

export async function listFavorites(userId: string, repository: SavedItineraryRepository): Promise<FavoriteView[]> {
  return (await repository.listFavorites(userId)).map(({ itinerary }) => {
    const { breakTitle, regionName, lengthLabel, startLabel, endLabel } = snapshotOf(itinerary.snapshot, itinerary.breakStart);
    return {
      id: itinerary.id,
      breakTitle,
      title: `${regionName} ${lengthLabel}`,
      period: rangeText(startLabel, endLabel),
      savedOn: kstDate(itinerary.createdAt),
      mine: itinerary.ownerId === userId,
    };
  });
}

function kstDate(at: Date | undefined): string {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(at ?? new Date(0));
  return dotDate(iso);
}
