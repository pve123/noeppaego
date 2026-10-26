import { describe, expect, it } from "vitest";
import { midLandRegionOf, toGrid } from "./kma-grid";

describe("toGrid", () => {
  it("기상청 공개 격자와 같다", () => {
    expect(toGrid(37.5665, 126.978)).toEqual({ nx: 60, ny: 127 }); // 서울시청
    expect(toGrid(35.1796, 129.0756)).toEqual({ nx: 98, ny: 76 }); // 부산시청
    expect(toGrid(33.4996, 126.5312)).toEqual({ nx: 53, ny: 38 }); // 제주시
  });
});

describe("midLandRegionOf", () => {
  it("시·도 코드로 권역을 고르고 강원은 영동·영서를 가른다", () => {
    expect(midLandRegionOf("41", 126.8)).toBe("11B00000");
    expect(midLandRegionOf("51", 128.9)).toBe("11D20000"); // 강릉
    expect(midLandRegionOf("51", 127.7)).toBe("11D10000"); // 춘천
    expect(midLandRegionOf("12", 127.7)).toBe("11F20000"); // 전남광주통합특별시
    expect(midLandRegionOf("99", 127)).toBeUndefined();
  });
});
