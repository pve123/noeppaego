import { describe, expect, it } from "vitest";
import { parsePrefs, prefsEntries, prefsSummary } from "./trip-prefs";

describe("여행 취향 주소 값", () => {
  it("읽고 다시 쓰면 같은 주소 — 기본값은 남기지 않는다", () => {
    const query = { with: "kids", pace: "relaxed", like: ["nature", "history"], avoid: ["seafood", "spicy"], dessert: "afterDinner" };
    expect(prefsEntries(parsePrefs(query))).toEqual([
      ["with", "kids"],
      ["pace", "relaxed"],
      ["like", "nature"],
      ["like", "history"],
      ["avoid", "seafood"],
      ["avoid", "spicy"],
      ["dessert", "afterDinner"],
    ]);
  });

  it("예전 주소의 날짜 붙은 값도 읽는다 — 날짜를 떼고 겹친 것은 하나로, 전·후는 뒤로", () => {
    const prefs = parsePrefs({ avoid: ["2026-12-26~meat", "2026-12-25~meat", "2026-12-25~spicy"], dessert: ["2026-12-26~beforeDinner", "2026-12-27~none"] });
    expect(prefs.avoid).toEqual(["meat", "spicy"]);
    expect(prefs.dessert).toBe("afterDinner");
    expect(parsePrefs({ dessert: "2026-12-25~beforeLunch" }).dessert).toBeUndefined(); // 점심 뒤 = 기본값
  });

  it("모르는 값은 버린다", () => {
    expect(parsePrefs({ with: "dog", pace: "normal", like: ["nature", "x", "nature"], avoid: ["어제~meat", "pizza"], dessert: "midnight" })).toEqual({
      companion: undefined,
      pace: undefined,
      interests: ["nature"],
      avoid: undefined,
      dessert: undefined,
    });
  });

  it("요약 칩 — 기본 디저트는 뺀다", () => {
    expect(prefsSummary(parsePrefs({ with: "parents", avoid: "spicy", dessert: "none" }))).toEqual(["👵 부모님과", "🚫 🌶️ 매운 음식", "🙅 디저트 안 들러요"]);
    expect(prefsSummary(parsePrefs({ dessert: "afterLunch" }))).toEqual([]);
  });
});
