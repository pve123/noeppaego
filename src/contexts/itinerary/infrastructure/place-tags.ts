/**
 * 분류 → 장소 성격(PlaceTag). 취향(관심사·동행·못 먹는 음식)과 맞춰 볼 때 쓴다(server-only 가 아니라 테스트할 수 있다).
 * 관광공사 신분류(lclsSystm3) 앞자리와 카카오 분류(「음식점 > 한식 > 육류,고기」)·상호에서 어림한다.
 */
import type { PlaceTag } from "../domain/place";

/** 관광공사 신분류 2단계(앞 4자리) — 실제 응답과 분류표(lclsSystmCode2)로 확인했다 */
const SIGHT_BY_CLASS: Record<string, readonly PlaceTag[]> = {
  NA01: ["nature", "mountain"], // 자연경관(산)
  NA02: ["nature", "ocean"], // 자연경관(하천·해양)
  NA03: ["nature", "ecology"], // 자연생태
  NA04: ["nature", "park"], // 자연공원
  NA05: ["nature"], // 기타 자연관광
  VE01: ["landmark"], // 랜드마크
  VE02: ["activity", "themepark"], // 테마공원
  VE03: ["nature", "park"], // 도시공원
  VE04: ["history"], // 도시·지역문화관광
  VE05: ["landmark"], // 복합관광시설
  VE06: ["exhibit"], // 공연시설
  VE07: ["exhibit"], // 전시시설
  VE09: ["exhibit", "education"], // 교육시설
  VE10: ["activity", "leisure"], // 레저스포츠시설
};
/** 1단계(앞 2자리) — 2단계에 없을 때 */
const SIGHT_BY_GROUP: Record<string, readonly PlaceTag[]> = {
  HS: ["history"], // 역사관광
  EX: ["activity"], // 체험관광
  LS: ["activity", "leisure"], // 레저스포츠
  SH: ["shopping"], // 쇼핑
};

export function sightTagsOf(code: string | undefined): PlaceTag[] {
  const c = code ?? "";
  return [...(SIGHT_BY_CLASS[c.slice(0, 4)] ?? SIGHT_BY_GROUP[c.slice(0, 2)] ?? [])];
}

/** 고기 — 분류나 상호에 이 말이 있으면 */
const MEAT_WORDS = ["육류", "고기", "갈비", "삼겹", "곱창", "막창", "족발", "보쌈", "치킨", "닭갈비", "불고기", "한우", "돼지", "소고기", "양꼬치", "스테이크", "돈까스", "돈가스", "순대"];
/** 해산물·회 — 「회관」 같은 상호에 걸리지 않게 「회」 한 글자는 분류 낱말이 딱 「회」일 때만 */
const SEAFOOD_WORDS = ["해물", "생선", "횟집", "물회", "초밥", "스시", "조개", "대게", "킹크랩", "장어", "아구", "아귀", "복어", "낙지", "주꾸미", "쭈꾸미", "오징어", "전복", "매운탕", "수산"];
/** 매운 음식 — 이름으로 알 수 있는 것만 */
const SPICY_WORDS = ["마라", "짬뽕", "떡볶이", "닭발", "낙지", "주꾸미", "쭈꾸미", "매운", "불닭", "아구찜", "아귀찜", "해물찜", "닭볶음탕", "김치찜"];

/** 카카오 식당 분류·상호 → 고기·해산물·매운 음식 */
export function foodTagsOf(categoryName: string, placeName: string): PlaceTag[] {
  const parts = categoryName.split(">").map((p) => p.trim());
  const text = `${categoryName} ${placeName}`;
  const tags = new Set<PlaceTag>();
  if (MEAT_WORDS.some((w) => text.includes(w))) tags.add("meat");
  if (parts.includes("회") || SEAFOOD_WORDS.some((w) => text.includes(w))) tags.add("seafood");
  if (SPICY_WORDS.some((w) => text.includes(w))) tags.add("spicy");
  return [...tags];
}
