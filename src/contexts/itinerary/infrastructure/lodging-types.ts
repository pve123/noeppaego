/**
 * 관광공사 숙박 분류(lclsSystm3) → 고르는 순서와 화면에 보일 종류(server-only 가 아니라 테스트할 수 있다).
 * 같은 거리면 호텔·콘도·한옥처럼 편하게 묵는 곳을 먼저, 모텔·수련원은 마지막에 고른다.
 * 코드는 실제 응답에서 확인했다 — 「…료칸호텔」처럼 이름이 호텔이어도 모텔(AC0401)로 분류된 곳이 있다.
 * tag 「budget」(실속형)은 아이·부모님과 갈 때 뒤로 미룬다.
 */
type LodgingType = { readonly rank: number; readonly label: string; readonly tag?: "budget" };

const BY_PREFIX: Record<string, LodgingType> = {
  AC0101: { rank: 0, label: "호텔" },
  AC0201: { rank: 0, label: "콘도·리조트" },
  AC0202: { rank: 0, label: "레지던스" },
  VE0502: { rank: 0, label: "리조트" },
  AC0302: { rank: 0, label: "한옥" },
  AC0301: { rank: 1, label: "펜션" },
  AC0601: { rank: 2, label: "유스호스텔", tag: "budget" },
  AC0401: { rank: 3, label: "모텔", tag: "budget" },
  VE1002: { rank: 3, label: "수련원", tag: "budget" },
};

/** 모르는 분류(민박·게스트하우스·기타 등)는 가운데 순서, 이름은 「숙소」 */
const UNKNOWN: LodgingType = { rank: 2, label: "숙소" };

export const lodgingTypeOf = (code: string | undefined): LodgingType => BY_PREFIX[(code ?? "").slice(0, 6)] ?? UNKNOWN;
