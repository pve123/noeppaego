import { describe, expect, it } from "vitest";
import { Coordinate } from "@/shared/kernel/coordinate";
import { Place, PlaceTag } from "./place";
import { allowedSights, fittingMeals, fittingSights, hasPrefs, preferredStays } from "./preferences";
import { draftTrip, fillStays, layoutOf, TripDay } from "./trip-planner";

const at = (x: number) => new Coordinate(37.7, 126.7 + x * 0.01);
const place = (id: string, x: number, tags: PlaceTag[] = [], extra: Partial<Place> = {}): Place => ({
  id,
  kind: "sight",
  title: id,
  location: at(x),
  address: "",
  indoor: false,
  tags,
  ...extra,
});
const ids = (places: Place[]) => places.map((p) => p.id);
const times = (day: TripDay) => day.slots.map((s) => s.time);

describe("layoutOf — 속도와 디저트", () => {
  it("여유롭게는 오전이 있는 날 오후 관광을 빼고, 첫날 오후는 둔다", () => {
    expect(layoutOf(0, 3, "relaxed")).toEqual(["lunch", "cafe", "afternoon", "dinner", "night"]);
    expect(layoutOf(1, 3, "relaxed")).toEqual(["morning", "lunch", "cafe", "dinner", "night"]);
  });

  it("꽉 차게는 저녁이 있는 날 저녁 뒤 밤 산책을 더한다", () => {
    expect(layoutOf(1, 3, "packed")).toEqual(["morning", "lunch", "cafe", "afternoon", "dinner", "evening", "night"]);
    expect(layoutOf(2, 3, "packed")).toEqual(["morning", "lunch", "cafe", "home"]);
  });

  it("디저트는 고른 때에 넣고, 안 먹으면 뺀다", () => {
    expect(layoutOf(1, 3, "normal", "beforeLunch")).toEqual(["morning", "cafe", "lunch", "afternoon", "dinner", "night"]);
    expect(layoutOf(1, 3, "normal", "beforeDinner")).toEqual(["morning", "lunch", "afternoon", "cafe", "dinner", "night"]);
    expect(layoutOf(1, 3, "packed", "afterDinner")).toEqual(["morning", "lunch", "afternoon", "dinner", "cafe", "evening", "night"]);
    expect(layoutOf(1, 3, "normal", "none")).toEqual(["morning", "lunch", "afternoon", "dinner", "night"]);
  });

  it("저녁이 없는 마지막 날에 저녁 전·후를 골랐으면 점심 뒤로", () => {
    expect(layoutOf(2, 3, "normal", "afterDinner")).toEqual(["morning", "lunch", "cafe", "home"]);
  });
});

describe("fittingSights", () => {
  const nature = place("숲", 0, ["nature", "mountain"]);
  const museum = place("박물관", 1, ["exhibit"]);
  const park = place("테마파크", 2, ["activity", "themepark"]);
  const market = place("시장", 3, ["shopping"]);

  it("고른 게 없으면 쇼핑만 빼고 그대로", () => {
    expect(ids(fittingSights([nature, museum, market], {}, "morning"))).toEqual(["숲", "박물관"]);
  });

  it("관심사에 맞는 곳만, 쇼핑은 고르면 들어간다", () => {
    expect(ids(fittingSights([nature, museum, market], { interests: ["history"] }, "morning"))).toEqual(["박물관"]);
    expect(ids(fittingSights([nature, museum, market], { interests: ["shopping"] }, "morning"))).toEqual(["시장"]);
  });

  it("아이와 가면 산은 빼고 테마파크를 반긴다", () => {
    expect(ids(fittingSights([nature, museum, park], { companion: "kids" }, "morning"))).toEqual(["박물관", "테마파크"]);
    expect(ids(fittingSights([nature, museum, park], { companion: "kids", interests: ["activity"] }, "morning"))).toEqual(["테마파크"]);
  });

  it("다 빼야 하면 빼기 전 목록을 쓴다 — 칸을 비우지 않는다", () => {
    expect(ids(fittingSights([nature], { companion: "parents" }, "morning"))).toEqual(["숲"]);
  });

  it("바꿀 후보에서도 빼고 싶은 곳은 뺀다", () => {
    expect(ids(allowedSights([nature, museum, market], { companion: "parents" }))).toEqual(["박물관"]);
  });
});

describe("draftTrip — 취향", () => {
  const dates = ["2026-12-25", "2026-12-26", "2026-12-27"];

  it("관심사에 맞는 곳부터 넣는다", () => {
    const sights = [place("A", 0), place("B", 1), place("바다", 5, ["nature", "ocean"]), place("숲", 6, ["nature"])];
    const visits = draftTrip(dates, sights, [], () => false, new Map(), { interests: ["nature"] })
      .flatMap((d) => d.slots)
      .flatMap((s) => (s.kind === "visit" ? [s.place.id] : []));
    expect(visits.slice(0, 2)).toEqual(["바다", "숲"]);
  });

  it("비 오는 반나절에는 취향보다 실내가 먼저", () => {
    const sights = [place("숲", 0, ["nature"]), place("미술관", 3, ["exhibit"], { indoor: true })];
    const days = draftTrip(["2026-12-25"], sights, [], () => true, new Map(), { interests: ["nature"] });
    const first = days[0].slots.find((s) => s.kind === "visit");
    expect(first?.kind === "visit" && first.place.id).toBe("미술관");
  });

  it("꽉 차게면 밤 칸에 야경·바다·공원을 고른다", () => {
    const sights = [place("A", 0), place("B", 0.1), place("C", 0.2), place("야경", 3, ["landmark"])];
    const day = draftTrip(["2026-12-25", "2026-12-26"], sights, [], () => false, new Map(), { pace: "packed" })[0];
    expect(times(day)).toEqual(["lunch", "cafe", "afternoon", "dinner", "evening", "night"]);
    const evening = day.slots.find((s) => s.time === "evening");
    expect(evening?.kind === "visit" && evening.place.id).toBe("야경");
  });

  it("날마다 디저트 시점을 따로 받는다", () => {
    const sights = ["A", "B", "C", "D"].map((id, i) => place(id, i));
    const days = draftTrip(dates, sights, [], () => false, new Map(), {
      days: { "2026-12-26": { dessert: "beforeDinner" }, "2026-12-27": { dessert: "none" } },
    });
    expect(times(days[0])).toEqual(["lunch", "cafe", "afternoon", "dinner", "night"]);
    expect(times(days[1])).toEqual(["morning", "lunch", "afternoon", "cafe", "dinner", "night"]);
    expect(times(days[2])).toEqual(["morning", "lunch", "home"]);
  });
});

describe("fittingMeals", () => {
  const date = "2026-12-25";
  const soup = place("국밥", 0, ["korean", "meat"], { kind: "restaurant" });
  const sushi = place("초밥", 0, ["japanese", "seafood"], { kind: "restaurant" });
  const mara = place("마라탕", 0, ["chinese", "spicy"], { kind: "restaurant" });

  it("못 먹는 음식은 꼭 뺀다 — 다 빠지면 빈 목록", () => {
    expect(ids(fittingMeals([soup, sushi, mara], "lunch", { avoid: ["seafood", "spicy"] }, date))).toEqual(["국밥"]);
    expect(ids(fittingMeals([sushi], "lunch", { avoid: ["seafood"] }, date))).toEqual([]);
  });

  it("그날 먹고 싶은 음식이 있으면 그것만, 없으면 다른 식당으로", () => {
    const prefs = { days: { [date]: { cuisine: "chinese" as const } } };
    expect(ids(fittingMeals([soup, sushi, mara], "dinner", prefs, date))).toEqual(["마라탕"]);
    expect(ids(fittingMeals([soup, sushi], "dinner", prefs, date))).toEqual(["국밥", "초밥"]);
  });

  it("카페 칸에는 음식 종류를 적용하지 않는다", () => {
    const cafe = place("디저트", 0, [], { kind: "cafe" });
    expect(ids(fittingMeals([cafe], "cafe", { days: { [date]: { cuisine: "chinese" } } }, date))).toEqual(["디저트"]);
  });
});

describe("숙소 취향", () => {
  const hotel = place("호텔", 1, ["hotel"], { kind: "lodging", rank: 0 });
  const hanok = place("한옥", 5, ["hanok"], { kind: "lodging", rank: 0 });
  const motel = place("모텔", 0.1, ["budget"], { kind: "lodging", rank: 3 });

  it("고른 종류를 앞으로", () => {
    expect(ids(preferredStays([hotel, motel, hanok], { stay: "hanok" }))).toEqual(["한옥", "호텔", "모텔"]);
  });

  it("아이·부모님과 가면 실속형은 뒤로", () => {
    expect(ids(preferredStays([motel, hotel], { companion: "kids" }))).toEqual(["호텔", "모텔"]);
    expect(ids(preferredStays([motel, hotel], {}))).toEqual(["모텔", "호텔"]);
  });

  it("fillStays 가 취향을 따른다", () => {
    const days = draftTrip(["2026-12-25", "2026-12-26"], [place("A", 0), place("B", 1)], []);
    const stay = fillStays(days, [hotel, hanok], new Map(), { stay: "hanok" })
      .flatMap((d) => d.slots)
      .find((s) => s.kind === "stay");
    expect(stay?.kind === "stay" && stay.choice?.id).toBe("한옥");
  });
});

describe("hasPrefs", () => {
  it("기본값(보통·점심 후 디저트)만 있으면 고른 게 없다", () => {
    expect(hasPrefs({})).toBe(false);
    expect(hasPrefs({ pace: "normal", days: { "2026-12-25": { dessert: "afterLunch" } } })).toBe(false);
    expect(hasPrefs({ pace: "relaxed" })).toBe(true);
    expect(hasPrefs({ days: { "2026-12-25": { dessert: "none" } } })).toBe(true);
  });
});
