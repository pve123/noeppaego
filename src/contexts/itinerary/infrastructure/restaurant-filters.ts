/**
 * 카카오 식당 목록을 끼니 후보로 거르는 규칙(server-only 가 아니라 테스트할 수 있다).
 */

/** 카카오 분류(「음식점 > 간식 > 제과,베이커리」)에 이 말이 있으면 끼니가 아니다 */
const NOT_A_MEAL = ["간식", "술집", "카페"];

export const isMeal = (categoryName: string) => !NOT_A_MEAL.some((word) => categoryName.includes(word));

/**
 * 카카오 카페 분류를 짧게 — 「음식점 > 카페 > 디저트카페」 → 「디저트카페」.
 * 「… > 커피전문점 > 스타벅스」처럼 끝이 상호면 그 앞(「커피전문점」)까지만. 「카페」 다음이 없으면 「카페」.
 */
export function cafeCategoryOf(categoryName: string): string {
  const parts = categoryName.split(">").map((p) => p.trim());
  const at = parts.indexOf("카페");
  return (at >= 0 ? parts[at + 1] : undefined) || "카페";
}

/**
 * 체인 지점인지 — 「맥도날드 해운대DT점」「소플러스 운정점」처럼 이름 끝 낱말이 「…점」이면 지점으로 본다.
 * 「남향막국수 본점」「그린식탁 운정본점」처럼 「본점」으로 끝나면 원조 가게라 남긴다. 한 낱말 이름은 지점이 아니다.
 */
export function isChainBranch(placeName: string): boolean {
  const words = placeName.trim().split(/\s+/);
  if (words.length < 2) return false;
  const last = words.at(-1)!;
  return last.endsWith("점") && !last.endsWith("본점");
}
