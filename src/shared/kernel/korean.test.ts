import { describe, expect, it } from "vitest";
import { hasBatchim, joinWithAnd, rangeText } from "./korean";

describe("hasBatchim", () => {
  it("마지막 한글 글자의 받침을 본다", () => {
    expect(hasBatchim("추석")).toBe(true);
    expect(hasBatchim("설날")).toBe(true);
    expect(hasBatchim("크리스마스")).toBe(false);
    expect(hasBatchim("12.24(목)")).toBe(true);
    expect(hasBatchim("12.25(금)")).toBe(true);
    expect(hasBatchim("12.26(토)")).toBe(false);
  });

  it("숫자로 끝나면 읽는 소리로 본다", () => {
    expect(hasBatchim("10.31")).toBe(true); // 일
    expect(hasBatchim("12.2")).toBe(false); // 이
  });
});

describe("joinWithAnd", () => {
  it("받침에 맞춰 과·와로 잇는다", () => {
    expect(joinWithAnd(["개천절", "추석"])).toBe("개천절과 추석");
    expect(joinWithAnd(["어린이날", "부처님오신날"])).toBe("어린이날과 부처님오신날");
    expect(joinWithAnd(["2.19(목)", "2.20(금)"])).toBe("2.19(목)과 2.20(금)");
    expect(joinWithAnd(["12.26(토)", "12.27(일)"])).toBe("12.26(토)와 12.27(일)");
    expect(joinWithAnd(["설날"])).toBe("설날");
  });
});

describe("rangeText", () => {
  it("부터·까지로 잇고 같은 날은 하나만", () => {
    expect(rangeText("12.25(금)", "12.27(일)")).toBe("12.25(금)부터 12.27(일)까지");
    expect(rangeText("12.25(금)", "12.25(금)")).toBe("12.25(금)");
  });
});
