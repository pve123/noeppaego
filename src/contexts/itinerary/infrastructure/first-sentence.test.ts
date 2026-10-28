import { describe, expect, it } from "vitest";
import { firstSentence } from "./first-sentence";

describe("firstSentence", () => {
  it("첫 문장만 — HTML 은 지운다", () => {
    expect(firstSentence("파산서원은 조선시대 서원이다. 1568년에 세워졌다.")).toBe("파산서원은 조선시대 서원이다.");
    expect(firstSentence("호텔이다.<br>객실은 넓다.")).toBe("호텔이다.");
  });

  it("소수점에서는 끊지 않는다", () => {
    expect(firstSentence("길이 1.5km 산책로가 있다. 다음 문장.")).toBe("길이 1.5km 산책로가 있다.");
  });

  it("길면 띄어쓰기에서 자르고 …", () => {
    const long = "아주 ".repeat(40) + "길다.";
    const out = firstSentence(long, 30)!;
    expect(out.endsWith("…")).toBe(true);
    expect([...out].length).toBeLessThanOrEqual(31);
  });

  it("비었으면 undefined", () => {
    expect(firstSentence("  <br> ")).toBeUndefined();
  });
});
