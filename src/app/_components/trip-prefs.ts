/**
 * 여행 취향 — 선택지(이모지·이름·설명)와 주소 값(`?with=kids&pace=relaxed&food=2026-12-25~chinese`) 읽고 쓰기.
 * 일정 화면(서버)과 취향 시트(클라이언트)가 같이 쓴다. 기본값은 주소에 남기지 않는다.
 */
import type {
  Companion,
  Cuisine,
  DayPrefs,
  DessertTime,
  FoodAvoid,
  Interest,
  Pace,
  StayType,
  TripPrefs,
} from "@/contexts/itinerary";

export type Option<T extends string> = { readonly value: T; readonly emoji: string; readonly label: string; readonly hint?: string };

export const COMPANIONS: readonly Option<Companion>[] = [
  { value: "solo", emoji: "🙋", label: "혼자" },
  { value: "couple", emoji: "💑", label: "연인·부부" },
  { value: "friends", emoji: "👯", label: "친구" },
  { value: "kids", emoji: "🧒", label: "아이와" },
  { value: "parents", emoji: "👵", label: "부모님과" },
];

export const PACES: readonly Option<Pace>[] = [
  { value: "relaxed", emoji: "🐢", label: "여유롭게", hint: "관광은 하루 한 곳" },
  { value: "normal", emoji: "🚶", label: "보통", hint: "오전·오후 한 곳씩" },
  { value: "packed", emoji: "🏃", label: "꽉 차게", hint: "저녁 뒤 밤 산책까지" },
];

export const INTERESTS: readonly Option<Interest>[] = [
  { value: "nature", emoji: "🌿", label: "자연" },
  { value: "history", emoji: "🏯", label: "역사·전시" },
  { value: "activity", emoji: "🎡", label: "체험·놀거리" },
  { value: "shopping", emoji: "🛍️", label: "쇼핑·시장" },
];

export const AVOIDS: readonly Option<FoodAvoid>[] = [
  { value: "seafood", emoji: "🐟", label: "해산물·회" },
  { value: "meat", emoji: "🥩", label: "고기" },
  { value: "spicy", emoji: "🌶️", label: "매운 음식" },
];

export const STAYS: readonly Option<StayType>[] = [
  { value: "hotel", emoji: "🏨", label: "호텔·리조트" },
  { value: "hanok", emoji: "🏠", label: "한옥" },
  { value: "pension", emoji: "🏡", label: "펜션" },
  { value: "budget", emoji: "💸", label: "실속형" },
];

export const CUISINES: readonly Option<Cuisine>[] = [
  { value: "korean", emoji: "🍚", label: "한식" },
  { value: "chinese", emoji: "🥟", label: "중식" },
  { value: "japanese", emoji: "🍣", label: "일식" },
  { value: "western", emoji: "🍝", label: "양식" },
  { value: "snack", emoji: "🍢", label: "분식" },
  { value: "meat", emoji: "🍖", label: "고기" },
];

/** 디저트 — 저녁 전·후는 저녁이 있는 날에만 */
export const DESSERTS: readonly (Option<DessertTime> & { readonly needsDinner?: boolean })[] = [
  { value: "none", emoji: "🙅", label: "안 먹어요" },
  { value: "beforeLunch", emoji: "☕", label: "점심 전" },
  { value: "afterLunch", emoji: "🍰", label: "점심 후" },
  { value: "beforeDinner", emoji: "🧁", label: "저녁 전", needsDinner: true },
  { value: "afterDinner", emoji: "🍨", label: "저녁 후", needsDinner: true },
];

export const DEFAULT_DESSERT: DessertTime = "afterLunch";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const valuesOf = <T extends string>(options: readonly Option<T>[]) => new Set<string>(options.map((o) => o.value));
const oneOf = <T extends string>(options: readonly Option<T>[], value: string | undefined): T | undefined =>
  value !== undefined && valuesOf(options).has(value) ? (value as T) : undefined;

type Query = Record<string, string | string[] | undefined>;
const all = (query: Query, key: string): string[] => [query[key] ?? []].flat();

/** 주소 값 → 취향. 모르는 값은 버린다 */
export function parsePrefs(query: Query): TripPrefs {
  const days: Record<string, { -readonly [K in keyof DayPrefs]: DayPrefs[K] }> = {};
  const day = (date: string) => (days[date] ??= {});
  for (const raw of all(query, "food")) {
    const [date, value] = raw.split("~");
    const cuisine = oneOf(CUISINES, value);
    if (ISO_DATE.test(date) && cuisine) day(date).cuisine = cuisine;
  }
  for (const raw of all(query, "dessert")) {
    const [date, value] = raw.split("~");
    const dessert = oneOf(DESSERTS, value);
    if (ISO_DATE.test(date) && dessert) day(date).dessert = dessert;
  }
  const pace = oneOf(PACES, all(query, "pace")[0]);
  const interests = [...new Set(all(query, "like"))].flatMap((v) => oneOf(INTERESTS, v) ?? []);
  const avoid = [...new Set(all(query, "avoid"))].flatMap((v) => oneOf(AVOIDS, v) ?? []);
  return {
    companion: oneOf(COMPANIONS, all(query, "with")[0]),
    pace: pace === "normal" ? undefined : pace,
    interests: interests.length > 0 ? interests : undefined,
    avoid: avoid.length > 0 ? avoid : undefined,
    stay: oneOf(STAYS, all(query, "stay")[0]),
    days: Object.keys(days).length > 0 ? days : undefined,
  };
}

/** 취향 → 주소 값 쌍. 기본값(보통·점심 후 디저트)은 넣지 않는다 */
export function prefsEntries(prefs: TripPrefs): [string, string][] {
  const out: [string, string][] = [];
  if (prefs.companion) out.push(["with", prefs.companion]);
  if (prefs.pace && prefs.pace !== "normal") out.push(["pace", prefs.pace]);
  for (const v of prefs.interests ?? []) out.push(["like", v]);
  for (const v of prefs.avoid ?? []) out.push(["avoid", v]);
  if (prefs.stay) out.push(["stay", prefs.stay]);
  for (const [date, day] of Object.entries(prefs.days ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (day.cuisine) out.push(["food", `${date}~${day.cuisine}`]);
    if (day.dessert && day.dessert !== DEFAULT_DESSERT) out.push(["dessert", `${date}~${day.dessert}`]);
  }
  return out;
}

const labelOf = <T extends string>(options: readonly Option<T>[], value: T) => options.find((o) => o.value === value);

/** 고른 취향 요약 칩 — 「🧒 아이와」「🐢 여유롭게」「🚫 🐟 해산물·회」「1일차 🥟 중식」 */
export function prefsSummary(prefs: TripPrefs, days: readonly { date?: string; dayNumber: number }[]): string[] {
  const chip = (o: Option<string> | undefined, prefix = "") => (o ? [`${prefix}${o.emoji} ${o.label}`] : []);
  const out = [
    ...chip(prefs.companion && labelOf(COMPANIONS, prefs.companion)),
    ...chip(prefs.pace && prefs.pace !== "normal" ? labelOf(PACES, prefs.pace) : undefined),
    ...(prefs.interests ?? []).flatMap((v) => chip(labelOf(INTERESTS, v))),
    ...(prefs.avoid ?? []).flatMap((v) => chip(labelOf(AVOIDS, v), "🚫 ")),
    ...chip(prefs.stay && labelOf(STAYS, prefs.stay)),
  ];
  for (const day of days) {
    const p = day.date ? prefs.days?.[day.date] : undefined;
    if (p?.cuisine) out.push(...chip(labelOf(CUISINES, p.cuisine), `${day.dayNumber}일차 `));
    if (p?.dessert && p.dessert !== DEFAULT_DESSERT) {
      const d = labelOf(DESSERTS, p.dessert);
      out.push(...(d ? [`${day.dayNumber}일차 ${d.emoji} 디저트 ${d.label}`] : []));
    }
  }
  return out;
}
