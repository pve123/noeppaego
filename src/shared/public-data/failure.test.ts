import { describe, expect, it } from "vitest";
import { failureOfCode } from "./failure";

describe("failureOfCode", () => {
  it("22 는 하루 한도 초과, 나머지 거절 코드는 거절", () => {
    expect(failureOfCode("22")).toBe("quota");
    expect(failureOfCode("30")).toBe("rejected"); // 등록되지 않은 키
    expect(failureOfCode("12")).toBe("rejected");
  });
});
