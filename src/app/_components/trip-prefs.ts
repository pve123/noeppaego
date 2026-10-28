/**
 * 여행 취향 — 선택지(이모지·이름·설명)와 주소 값(`?with=kids&pace=relaxed&avoid=2026-12-25~seafood`) 읽고 쓰기.
 * 누구와·속도·좋아하는 것은 여행 전체, 못 먹는 음식·디저트는 날마다(값 앞에 날짜를 붙인다).
 * 일정 화면(서버)과 취향 시트(클라이언트)가 같이 쓴다. 기본값은 주소에 남기지 않는다.
 */
import type { Companion, DayPrefs, DessertTime, FoodAvoid, Interest, Pace, TripPrefs } from "@/contexts/itinerary";

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
const oneOf = <T extends string>(options: readonly Option<T>[], value: string | undefined): T | undefined =>
  options.find((o) => o.value === value)?.value;

type Query = Record<string, string | string[] | undefined>;
const all = (query: Query, key: string): string[] => [query[key] ?? []].flat();

/** 날짜를 붙인 값(`2026-12-25~seafood`) → [날짜, 값]. 날짜 형식이 아니면 undefined */
const dated = (raw: string): [string, string] | undefined => {
  const [date, value] = raw.split("~");
  return ISO_DATE.test(date) && value ? [date, value] : undefined;
};
/** 날짜를 붙인 값만 — flatMap 은 [날짜, 값] 쌍까지 펼쳐 버려서 한 겹 싸서 넘긴다 */
const datedAll = (query: Query, key: string): [string, string][] => all(query, key).flatMap((raw) => {
  const pair = dated(raw);
  return pair ? [pair] : [];
});

/** 주소 값 → 취향. 모르는 값은 버린다 */
export function parsePrefs(query: Query): TripPrefs {
  const days: Record<string, { avoid?: FoodAvoid[]; dessert?: DessertTime }> = {};
  const day = (date: string) => (days[date] ??= {});
  for (const [date, value] of datedAll(query, "avoid")) {
    const avoid = oneOf(AVOIDS, value);
    if (avoid && !day(date).avoid?.includes(avoid)) day(date).avoid = [...(day(date).avoid ?? []), avoid];
  }
  for (const [date, value] of datedAll(query, "dessert")) {
    const dessert = oneOf(DESSERTS, value);
    if (dessert) day(date).dessert = dessert;
  }
  for (const [date, d] of Object.entries(days)) if (!d.avoid && !d.dessert) delete days[date];
  const pace = oneOf(PACES, all(query, "pace")[0]);
  const interests = [...new Set(all(query, "like"))].flatMap((v) => oneOf(INTERESTS, v) ?? []);
  return {
    companion: oneOf(COMPANIONS, all(query, "with")[0]),
    pace: pace === "normal" ? undefined : pace,
    interests: interests.length > 0 ? interests : undefined,
    days: Object.keys(days).length > 0 ? days : undefined,
  };
}

/** 취향 → 주소 값 쌍. 기본값(보통·점심 후 디저트)은 넣지 않는다 */
export function prefsEntries(prefs: TripPrefs): [string, string][] {
  const out: [string, string][] = [];
  if (prefs.companion) out.push(["with", prefs.companion]);
  if (prefs.pace && prefs.pace !== "normal") out.push(["pace", prefs.pace]);
  for (const v of prefs.interests ?? []) out.push(["like", v]);
  const days = Object.entries(prefs.days ?? {}).sort(([a], [b]) => a.localeCompare(b));
  for (const [date, day] of days) for (const v of day.avoid ?? []) out.push(["avoid", `${date}~${v}`]);
  for (const [date, day] of days) if (day.dessert && day.dessert !== DEFAULT_DESSERT) out.push(["dessert", `${date}~${day.dessert}`]);
  return out;
}

const find = <T extends string>(options: readonly Option<T>[], value: T) => options.find((o) => o.value === value);
const chip = (o: Option<string> | undefined, prefix = "") => (o ? [`${prefix}${o.emoji} ${o.label}`] : []);

/** 고른 취향 요약 칩 — 「🧒 아이와」「🐢 여유롭게」「1일차 🚫 🐟 해산물·회」「2일차 🧁 디저트 저녁 전」 */
export function prefsSummary(prefs: TripPrefs, days: readonly { date?: string; dayNumber: number }[]): string[] {
  const out = [
    ...chip(prefs.companion && find(COMPANIONS, prefs.companion)),
    ...chip(prefs.pace && prefs.pace !== "normal" ? find(PACES, prefs.pace) : undefined),
    ...(prefs.interests ?? []).flatMap((v) => chip(find(INTERESTS, v))),
  ];
  for (const day of days) {
    const p: DayPrefs | undefined = day.date ? prefs.days?.[day.date] : undefined;
    for (const v of p?.avoid ?? []) out.push(...chip(find(AVOIDS, v), `${day.dayNumber}일차 🚫 `));
    if (p?.dessert && p.dessert !== DEFAULT_DESSERT) {
      const d = find(DESSERTS, p.dessert);
      if (d) out.push(`${day.dayNumber}일차 ${d.emoji} 디저트 ${d.label}`);
    }
  }
  return out;
}
