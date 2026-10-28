import { describe, expect, it } from "vitest";
import { isSamePlace, normalizeName } from "./place-match";

describe("isSamePlace", () => {
  it("이름이 같거나 한쪽이 다른 쪽을 품고 300m 안이면 같은 곳", () => {
    expect(isSamePlace("IMT호텔", "IMT 호텔", 20)).toBe(true);
    expect(isSamePlace("가람나무", "가람나무 한옥스테이", 150)).toBe(true);
    expect(isSamePlace("파주메이트호텔(Paju Mate Hotel)", "파주메이트호텔", 40)).toBe(true);
  });

  it("바로 옆(50m 안)이면 「호텔」 자리만 다른 이름도 같은 곳 — 관광공사 「호텔미즈」, 카카오 「미즈호텔」", () => {
    expect(isSamePlace("호텔미즈", "미즈호텔", 1)).toBe(true);
    expect(isSamePlace("호텔미즈", "미즈호텔", 120)).toBe(false);
    expect(isSamePlace("호텔", "모텔", 1)).toBe(false);
  });

  it("이름이 다르거나 멀면 다른 곳", () => {
    expect(isSamePlace("호텔미즈", "호텔루나", 10)).toBe(false);
    expect(isSamePlace("IMT호텔", "IMT호텔", 800)).toBe(false);
    expect(isSamePlace("가", "가람나무", 10)).toBe(false);
  });
});

describe("normalizeName", () => {
  it("괄호 안과 띄어쓰기를 뺀다", () => {
    expect(normalizeName("가람나무 (한옥스테이)")).toBe("가람나무");
  });
});
