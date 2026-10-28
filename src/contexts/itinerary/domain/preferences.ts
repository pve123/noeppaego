import type { Place, PlaceTag } from "./place";

/** 누구와 가는지 */
export type Companion = "solo" | "couple" | "friends" | "kids" | "parents";
/** 여행 속도 — 여유롭게면 하루 관광을 하나 줄이고, 꽉 차게면 저녁 뒤 밤 산책을 더한다 */
export type Pace = "relaxed" | "normal" | "packed";
/** 좋아하는 것 */
export type Interest = "nature" | "history" | "activity" | "shopping";
/** 못 먹는 음식 */
export type FoodAvoid = "seafood" | "meat" | "spicy";
/** 숙소 종류 */
export type StayType = "hotel" | "hanok" | "pension" | "budget";
/** 그날 먹고 싶은 음식 */
export type Cuisine = "korean" | "chinese" | "japanese" | "western" | "snack" | "meat";
/** 그날 디저트(카페) — 없음 또는 언제 들를지 */
export type DessertTime = "none" | "beforeLunch" | "afterLunch" | "beforeDinner" | "afterDinner";

export type DayPrefs = { readonly cuisine?: Cuisine; readonly dessert?: DessertTime };

/**
 * 여행 취향 — 고른 것만 반영한다. 아무것도 안 골랐으면 예전과 같은 일정이 나온다.
 * 숙소는 매일 같은 곳에 묵어서 여행 전체로, 음식과 디저트는 날마다 받는다.
 */
export type TripPrefs = {
  readonly companion?: Companion;
  readonly pace?: Pace;
  readonly interests?: readonly Interest[];
  readonly avoid?: readonly FoodAvoid[];
  readonly stay?: StayType;
  /** 날짜(YYYY-MM-DD) → 그날 취향 */
  readonly days?: Readonly<Record<string, DayPrefs>>;
};

/** 하나라도 골랐는지 */
export const hasPrefs = (prefs: TripPrefs): boolean =>
  Boolean(
    prefs.companion ||
      (prefs.pace && prefs.pace !== "normal") ||
      prefs.interests?.length ||
      prefs.avoid?.length ||
      prefs.stay ||
      Object.values(prefs.days ?? {}).some((d) => d.cuisine || (d.dessert && d.dessert !== "afterLunch")),
  );

// ── 볼거리 ─────────────────────────────────────────────

const INTEREST_TAGS: Record<Interest, readonly PlaceTag[]> = {
  nature: ["nature"],
  history: ["history", "exhibit"],
  activity: ["activity"],
  shopping: ["shopping"],
};

/** 동행마다 반기는 곳과 빼는 곳 — 아이와는 산행을, 부모님과는 레저·산행을 뺀다 */
const COMPANION_TAGS: Record<Companion, { readonly likes: readonly PlaceTag[]; readonly skips: readonly PlaceTag[] }> = {
  solo: { likes: ["exhibit", "history"], skips: [] },
  couple: { likes: ["landmark", "ocean", "exhibit", "park"], skips: [] },
  friends: { likes: ["activity", "leisure", "themepark", "ocean"], skips: [] },
  kids: { likes: ["themepark", "education", "ecology", "activity", "exhibit"], skips: ["mountain"] },
  parents: { likes: ["history", "park", "exhibit", "landmark"], skips: ["leisure", "mountain"] },
};

/** 밤 산책 칸은 야경·바다·공원 */
const EVENING_TAGS: readonly PlaceTag[] = ["landmark", "ocean", "park"];

const has = (place: Place, tags: readonly PlaceTag[]) => tags.some((t) => place.tags?.includes(t));

/**
 * 볼거리 점수 — 관심사 2, 동행이 반기는 곳 1, 밤 칸에 맞는 곳 1. undefined 면 빼고 싶은 곳.
 * 쇼핑·시장은 쇼핑을 고른 사람에게만 넣는다.
 */
function visitScore(place: Place, prefs: TripPrefs, time: "morning" | "afternoon" | "evening"): number | undefined {
  const companion = prefs.companion && COMPANION_TAGS[prefs.companion];
  if (companion && has(place, companion.skips)) return undefined;
  if (has(place, ["shopping"]) && !prefs.interests?.includes("shopping")) return undefined;
  const interest = (prefs.interests ?? []).some((i) => has(place, INTEREST_TAGS[i])) ? 2 : 0;
  const liked = companion && has(place, companion.likes) ? 1 : 0;
  const evening = time === "evening" && has(place, EVENING_TAGS) ? 1 : 0;
  return interest + liked + evening;
}

/** 취향에 맞는 볼거리 — 뺄 곳을 빼고 점수가 가장 높은 곳들. 다 빠지면 빼기 전 목록 */
export function fittingSights(places: readonly Place[], prefs: TripPrefs, time: "morning" | "afternoon" | "evening"): Place[] {
  const scored = places.flatMap((p) => {
    const score = visitScore(p, prefs, time);
    return score === undefined ? [] : [{ p, score }];
  });
  if (scored.length === 0) return [...places];
  const best = Math.max(...scored.map((s) => s.score));
  return scored.filter((s) => s.score === best).map((s) => s.p);
}

/** 바꿀 후보로 보여 줘도 되는 볼거리 — 빼고 싶은 곳만 뺀다 */
export const allowedSights = (places: readonly Place[], prefs: TripPrefs): Place[] =>
  places.filter((p) => visitScore(p, prefs, "afternoon") !== undefined);

// ── 식사 ───────────────────────────────────────────────

const AVOID_TAG: Record<FoodAvoid, PlaceTag> = { seafood: "seafood", meat: "meat", spicy: "spicy" };
const CUISINE_TAG: Record<Cuisine, PlaceTag> = {
  korean: "korean",
  chinese: "chinese",
  japanese: "japanese",
  western: "western",
  snack: "snack",
  meat: "meat",
};

/**
 * 식사·카페 칸 후보를 취향에 맞춘다.
 * 못 먹는 음식은 꼭 뺀다(다 빠지면 그 칸은 빈다). 그날 먹고 싶은 음식은 있으면 그것만, 없으면 다른 식당으로.
 */
export function fittingMeals(places: readonly Place[], time: "lunch" | "cafe" | "dinner", prefs: TripPrefs, date: string): Place[] {
  const avoid = (prefs.avoid ?? []).map((a) => AVOID_TAG[a]);
  const edible = places.filter((p) => !has(p, avoid));
  const cuisine = time === "cafe" ? undefined : prefs.days?.[date]?.cuisine;
  if (!cuisine) return edible;
  const wanted = edible.filter((p) => has(p, [CUISINE_TAG[cuisine]]));
  return wanted.length > 0 ? wanted : edible;
}

// ── 숙소 ───────────────────────────────────────────────

/**
 * 숙소 후보를 취향 순으로 — 고른 종류를 앞으로. 종류를 안 골랐어도 아이·부모님과 가면 실속형(모텔 등)은 뒤로.
 * ordered 는 이미 기본 순서(종류·거리)로 정렬돼 있다.
 */
export function preferredStays(ordered: readonly Place[], prefs: TripPrefs): Place[] {
  const wanted: PlaceTag | undefined = prefs.stay;
  if (wanted) {
    const match = ordered.filter((p) => has(p, [wanted]));
    return [...match, ...ordered.filter((p) => !match.includes(p))];
  }
  if (prefs.companion === "kids" || prefs.companion === "parents") {
    const budget = ordered.filter((p) => has(p, ["budget"]));
    return [...ordered.filter((p) => !budget.includes(p)), ...budget];
  }
  return [...ordered];
}
