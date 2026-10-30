import { describe, expect, it } from "vitest";
import { originOf } from "./origin";

describe("originOf", () => {
  it("도시 id 는 그 도시, 모르는 id 는 서울", () => {
    expect(originOf("busan").name).toBe("부산");
    expect(originOf("nowhere").name).toBe("서울");
    expect(originOf(undefined).name).toBe("서울");
  });

  it("here:위도,경도 는 내 위치 — 소수 둘째 자리(약 1km)로 줄인다", () => {
    const here = originOf("here:37.56789,126.97712");
    expect(here.name).toBe("내 위치");
    expect([here.at.lat, here.at.lng]).toEqual([37.57, 126.98]);
    expect(here.id).toBe("here:37.57,126.98");
  });

  it("형식이 틀리거나 우리나라 밖이면 서울로", () => {
    expect(originOf("here:abc").name).toBe("서울");
    expect(originOf("here:40.7,-74.0").name).toBe("서울");
  });
});
