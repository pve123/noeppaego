import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/shared/tour-api/tour-api", () => ({ ContentType: { sight: "12", culture: "14", lodging: "32" }, fetchIntroParking: vi.fn() }));

const { cleanIntroText } = await import("./tour-facility-parking");

describe("cleanIntroText", () => {
  it("태그·엔티티·겹친 공백을 한 줄로", () => {
    expect(cleanIntroText("가능<br>(대형 20대,&nbsp;소형 150대)<br />\n 무료")).toBe("가능 (대형 20대, 소형 150대) 무료");
  });

  it("너무 길면 줄인다", () => {
    expect(cleanIntroText("가".repeat(100))).toHaveLength(80);
  });
});
