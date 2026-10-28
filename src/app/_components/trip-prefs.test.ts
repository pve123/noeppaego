import { describe, expect, it } from "vitest";
import { parsePrefs, prefsEntries, prefsSummary } from "./trip-prefs";

describe("여행 취향 주소 값", () => {
  it("읽고 다시 쓰면 같은 주소 — 날마다 고른 것은 날짜를 붙이고, 기본값은 남기지 않는다", () => {
    const query = {
      with: "kids",
      pace: "relaxed",
      like: ["nature", "history"],
      avoid: ["2026-12-26~meat", "2026-12-25~seafood", "2026-12-25~spicy"],
      dessert: ["2026-12-25~afterLunch", "2026-12-26~beforeDinner"],
    };
    expect(prefsEntries(parsePrefs(query))).toEqual([
      ["with", "kids"],
      ["pace", "relaxed"],
      ["like", "nature"],
      ["like", "history"],
      ["avoid", "2026-12-25~seafood"],
      ["avoid", "2026-12-25~spicy"],
      ["avoid", "2026-12-26~meat"],
      ["dessert", "2026-12-26~beforeDinner"],
    ]);
  });

  it("모르는 값·날짜 없는 값은 버린다", () => {
    expect(parsePrefs({ with: "dog", pace: "normal", like: ["nature", "x", "nature"], avoid: ["seafood", "어제~meat", "2026-12-25~pizza"] })).toEqual({
      companion: undefined,
      pace: undefined,
      interests: ["nature"],
      days: undefined,
    });
  });

  it("요약 칩 — 일차를 붙이고 기본 디저트는 뺀다", () => {
    const prefs = parsePrefs({ with: "parents", avoid: "2026-12-25~spicy", dessert: "2026-12-25~none" });
    expect(prefsSummary(prefs, [{ date: "2026-12-25", dayNumber: 1 }])).toEqual(["👵 부모님과", "1일차 🚫 🌶️ 매운 음식", "1일차 🙅 디저트 안 먹어요"]);
  });
});
