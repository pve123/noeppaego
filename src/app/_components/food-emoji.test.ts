import { describe, expect, it } from "vitest";
import { foodEmojiOf } from "./food-emoji";

describe("foodEmojiOf", () => {
  it("분류 낱말로 메뉴 그림을 고른다", () => {
    expect(foodEmojiOf("치킨", "restaurant")).toBe("🍗");
    expect(foodEmojiOf("해장국", "restaurant")).toBe("🍲");
    expect(foodEmojiOf("막국수", "restaurant")).toBe("🍜");
    expect(foodEmojiOf("디저트카페", "cafe")).toBe("🍰");
  });

  it("해산물이 국수보다 먼저 — 「해물칼국수」는 해산물", () => {
    expect(foodEmojiOf("해물칼국수", "restaurant")).toBe("🐟");
  });

  it("모르는 분류는 식당이면 접시, 카페면 커피", () => {
    expect(foodEmojiOf("한식", "restaurant")).toBe("🍽️");
    expect(foodEmojiOf(undefined, "cafe")).toBe("☕");
  });
});
