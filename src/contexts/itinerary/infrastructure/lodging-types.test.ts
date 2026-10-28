import { describe, expect, it } from "vitest";
import { lodgingTypeOf } from "./lodging-types";

describe("lodgingTypeOf", () => {
  it("호텔·한옥이 먼저, 펜션, 모르는 숙소, 모텔 순", () => {
    expect(lodgingTypeOf("AC010100")).toEqual({ rank: 0, label: "호텔" });
    expect(lodgingTypeOf("AC030200").label).toBe("한옥");
    expect(lodgingTypeOf("AC030100").rank).toBe(1);
    expect(lodgingTypeOf("AC030400")).toEqual({ rank: 2, label: "숙소" });
    expect(lodgingTypeOf("AC040100")).toEqual({ rank: 3, label: "모텔", tag: "budget" });
  });

  it("분류가 없으면 가운데 순서의 「숙소」", () => {
    expect(lodgingTypeOf(undefined)).toEqual({ rank: 2, label: "숙소" });
  });
});
