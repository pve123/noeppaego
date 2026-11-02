import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/shared/tour-api/tour-api", () => ({
  ContentType: { sight: "12", culture: "14", lodging: "32", restaurant: "39" },
  fetchIntroParking: vi.fn(),
  fetchHomepage: vi.fn(),
}));

const { cleanIntroText, homepageOf, TourFacilityParking } = await import("./tour-facility-parking");
const tour = await import("@/shared/tour-api/tour-api");

describe("cleanIntroText", () => {
  it("태그·엔티티·겹친 공백을 한 줄로", () => {
    expect(cleanIntroText("가능<br>(대형 20대,&nbsp;소형 150대)<br />\n 무료")).toBe("가능 (대형 20대, 소형 150대) 무료");
  });

  it("너무 길면 줄인다", () => {
    expect(cleanIntroText("가".repeat(100))).toHaveLength(80);
  });
});

describe("homepageOf", () => {
  it("태그가 섞인 칸에서 첫 주소만", () => {
    expect(homepageOf('<a href="https://festival.example.kr/" target="_blank">https://festival.example.kr/</a>')).toBe("https://festival.example.kr/");
    expect(homepageOf("홈페이지 없음")).toBeUndefined();
  });
});

describe("TourFacilityParking — 식당·카페·축제", () => {
  const source = new TourFacilityParking();

  it("관광공사 식당·카페는 음식점(39) 주차 칸을 읽는다", async () => {
    vi.mocked(tour.fetchIntroParking).mockResolvedValue({ ok: true, value: { parking: "가능 (10대)", fee: "" } });
    expect(await source.parkingOf("tour:123", "cafe")).toEqual({ text: "가능 (10대)", fee: undefined });
    expect(tour.fetchIntroParking).toHaveBeenLastCalledWith("123", "39");
  });

  it("축제는 일반 안내와 홈페이지 — 홈페이지가 없어도 안내는 준다", async () => {
    vi.mocked(tour.fetchHomepage).mockResolvedValue({ ok: true, value: '<a href="https://fest.kr">fest</a>' });
    expect(await source.parkingOf("tour:9", "festival")).toMatchObject({ homepage: "https://fest.kr", general: true });
    vi.mocked(tour.fetchHomepage).mockResolvedValue({ ok: true, value: "" });
    expect(await source.parkingOf("tour:9", "festival")).toMatchObject({ homepage: undefined, general: true });
  });

  it("카카오 가게는 모른다(화면이 카카오맵 링크로 대신한다)", async () => {
    expect(await source.parkingOf("kakao:1", "restaurant")).toBeUndefined();
  });
});
