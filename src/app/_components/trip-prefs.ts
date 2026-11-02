/**
 * 여행 취향 — 선택지(이모지·이름·설명)와 주소 값(`?with=kids&pace=relaxed&avoid=seafood&dessert=afterDinner`) 읽고 쓰기.
 * 모두 여행 전체에 한 번. 예전 주소의 날짜 붙은 값(`avoid=2026-12-25~seafood`, `dessert=…~beforeDinner`)도 읽는다.
 * 일정 화면(서버)과 취향 시트(클라이언트)가 같이 쓴다. 기본값은 주소에 남기지 않는다.
 */
import type { Companion, DessertTime, FoodAvoid, Interest, Pace, TripPrefs } from "@/contexts/itinerary";

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

/** 디저트(카페) — 저녁 뒤를 골라도 저녁이 없는 마지막 날은 점심 뒤에 들른다 */
export const DESSERTS: readonly Option<DessertTime>[] = [
  { value: "afterLunch", emoji: "🍰", label: "점심 뒤" },
  { value: "afterDinner", emoji: "🍨", label: "저녁 뒤" },
  { value: "none", emoji: "🙅", label: "안 들러요" },
];
/** 예전 주소의 디저트 값 — 전·후를 뒤로 모은다 */
const LEGACY_DESSERT: Record<string, DessertTime> = { beforeLunch: "afterLunch", beforeDinner: "afterDinner" };

export const DEFAULT_DESSERT: DessertTime = "afterLunch";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const oneOf = <T extends string>(options: readonly Option<T>[], value: string | undefined): T | undefined =>
  options.find((o) => o.value === value)?.value;

type Query = Record<string, string | string[] | undefined>;
const all = (query: Query, key: string): string[] => [query[key] ?? []].flat();

/** 예전 주소는 값 앞에 날짜를 붙였다(`2026-12-25~seafood`) — 날짜를 떼고 값만 */
const undated = (raw: string) => {
  const [date, value] = raw.split("~");
  return value !== undefined && ISO_DATE.test(date) ? value : raw;
};

/** 주소 값 → 취향. 모르는 값은 버린다 */
export function parsePrefs(query: Query): TripPrefs {
  const pace = oneOf(PACES, all(query, "pace")[0]);
  const interests = [...new Set(all(query, "like"))].flatMap((v) => oneOf(INTERESTS, v) ?? []);
  const avoid = [...new Set(all(query, "avoid").map(undated))].flatMap((v) => oneOf(AVOIDS, v) ?? []);
  const rawDessert = all(query, "dessert").map(undated)[0];
  const dessert = rawDessert ? (oneOf(DESSERTS, rawDessert) ?? LEGACY_DESSERT[rawDessert]) : undefined;
  return {
    companion: oneOf(COMPANIONS, all(query, "with")[0]),
    pace: pace === "normal" ? undefined : pace,
    interests: interests.length > 0 ? interests : undefined,
    avoid: avoid.length > 0 ? avoid : undefined,
    dessert: dessert === DEFAULT_DESSERT ? undefined : dessert,
  };
}

/** 취향 → 주소 값 쌍. 기본값(보통·점심 뒤 디저트)은 넣지 않는다 */
export function prefsEntries(prefs: TripPrefs): [string, string][] {
  const out: [string, string][] = [];
  if (prefs.companion) out.push(["with", prefs.companion]);
  if (prefs.pace && prefs.pace !== "normal") out.push(["pace", prefs.pace]);
  for (const v of prefs.interests ?? []) out.push(["like", v]);
  for (const v of prefs.avoid ?? []) out.push(["avoid", v]);
  if (prefs.dessert && prefs.dessert !== DEFAULT_DESSERT) out.push(["dessert", prefs.dessert]);
  return out;
}

const find = <T extends string>(options: readonly Option<T>[], value: T) => options.find((o) => o.value === value);
const chip = (o: Option<string> | undefined, prefix = "") => (o ? [`${prefix}${o.emoji} ${o.label}`] : []);

/** 고른 취향 요약 칩 — 「🧒 아이와」「🐢 여유롭게」「🚫 🐟 해산물·회」「🍨 디저트 저녁 뒤」 */
export function prefsSummary(prefs: TripPrefs): string[] {
  const dessert = prefs.dessert && prefs.dessert !== DEFAULT_DESSERT ? find(DESSERTS, prefs.dessert) : undefined;
  return [
    ...chip(prefs.companion && find(COMPANIONS, prefs.companion)),
    ...chip(prefs.pace && prefs.pace !== "normal" ? find(PACES, prefs.pace) : undefined),
    ...(prefs.interests ?? []).flatMap((v) => chip(find(INTERESTS, v))),
    ...(prefs.avoid ?? []).flatMap((v) => chip(find(AVOIDS, v), "🚫 ")),
    ...(dessert ? [`${dessert.emoji} 디저트 ${dessert.label}`] : []),
  ];
}
