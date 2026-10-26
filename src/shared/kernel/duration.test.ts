import { describe, expect, it } from "vitest";
import { durationLabel } from "./duration";

describe("durationLabel", () => {
  it("10분 미만은 분 그대로, 그 위는 5분 단위", () => {
    expect(durationLabel(3.4)).toBe("약 3분");
    expect(durationLabel(0.2)).toBe("약 1분");
    expect(durationLabel(12)).toBe("약 10분");
    expect(durationLabel(13)).toBe("약 15분");
  });

  it("한 시간 넘으면 시간과 분, 딱 떨어지면 시간만", () => {
    expect(durationLabel(131)).toBe("약 2시간 10분");
    expect(durationLabel(119)).toBe("약 2시간");
  });
});
