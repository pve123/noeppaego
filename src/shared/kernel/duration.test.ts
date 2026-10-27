import { describe, expect, it } from "vitest";
import { durationLabel, estimateDriveMinutes } from "./duration";

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

describe("estimateDriveMinutes", () => {
  it("직선 1km 는 약 5분, 5km 는 약 15분 — 길찾기 결과와 같은 모양으로 보인다", () => {
    expect(durationLabel(estimateDriveMinutes(1))).toBe("약 5분");
    expect(durationLabel(estimateDriveMinutes(5))).toBe("약 15분");
  });

  it("거리가 0 이어도 출발·주차 몇 분은 든다", () => {
    expect(durationLabel(estimateDriveMinutes(0))).toBe("약 2분");
  });
});
