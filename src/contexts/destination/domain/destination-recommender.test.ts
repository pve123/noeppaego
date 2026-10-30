import { describe, expect, it } from "vitest";
import { Coordinate, SEOUL } from "@/shared/kernel/coordinate";
import { recommendDestinations, reachMinutes, reachPreferenceOf } from "./destination-recommender";
import { Festival } from "./festival";
import { TravelWindow } from "@/shared/kernel/travel-window";

const GANGNEUNG = new Coordinate(37.7519, 128.8761); // 서울에서 약 165km, 차로 약 2시간 50분
const BUSAN = new Coordinate(35.1796, 129.0756); // 약 325km, 차로 약 5시간 25분
const JEJU = new Coordinate(33.4996, 126.5312); // 약 450km
const PAJU = new Coordinate(37.7599, 126.78); // 약 27km

let seq = 0;
const festival = (regionCode: string, location: Coordinate, start: string, end: string): Festival => ({
  id: String(++seq).padStart(3, "0"),
  title: `축제 ${seq}`,
  start,
  end,
  location,
  region: { code: regionCode, name: regionCode },
  address: "",
});

const codes = (window: TravelWindow, festivals: Festival[]) =>
  recommendDestinations(festivals, window, SEOUL).map((d) => d.region.code);

describe("TravelWindow", () => {
  it("겹치는 날수를 양 끝 포함으로 센다", () => {
    const w = TravelWindow.of("2026-12-25", "2026-12-27");
    expect(w.days).toBe(3);
    expect(w.overlapDays("2026-10-31", "2026-12-25")).toBe(1);
    expect(w.overlapDays("2026-12-26", "2027-01-31")).toBe(2);
    expect(w.overlapDays("2026-12-28", "2026-12-31")).toBe(0);
  });
});

describe("Coordinate", () => {
  it("서울–부산 직선 거리는 약 325km", () => {
    const km = SEOUL.distanceKm(BUSAN);
    expect(km).toBeGreaterThan(320);
    expect(km).toBeLessThan(330);
  });
});

describe("recommendDestinations", () => {
  const threeDays = TravelWindow.of("2026-12-25", "2026-12-27");

  it("연휴와 겹치지 않는 축제는 뺀다", () => {
    expect(codes(threeDays, [festival("파주", PAJU, "2026-12-28", "2026-12-31")])).toEqual([]);
  });

  it("축제가 많은 지역이 먼저, 같으면 가까운 곳이 먼저", () => {
    const result = codes(threeDays, [
      festival("부산", BUSAN, "2026-12-01", "2026-12-31"),
      festival("부산", BUSAN, "2026-12-20", "2026-12-25"),
      festival("강릉", GANGNEUNG, "2026-12-24", "2026-12-26"),
      festival("파주", PAJU, "2026-12-24", "2026-12-26"),
    ]);
    expect(result).toEqual(["부산", "파주", "강릉"]);
  });

  it("사흘 연휴는 제주를 빼고, 나흘 이상이면 넣는다", () => {
    const jeju = [festival("50-110", JEJU, "2026-12-01", "2027-01-31")];
    expect(codes(threeDays, jeju)).toEqual([]);
    expect(codes(TravelWindow.of("2026-12-24", "2026-12-27"), jeju)).toEqual(["50-110"]);
  });

  it("남쪽 출발지에서 차로 6시간 30분 안이어도 사흘 연휴엔 제주를 뺀다", () => {
    const GWANGJU = new Coordinate(35.1595, 126.8526); // 제주까지 약 180km
    const jeju = [festival("50-110", JEJU, "2026-12-01", "2027-01-31")];
    expect(recommendDestinations(jeju, threeDays, GWANGJU)).toEqual([]);
    expect(recommendDestinations(jeju, TravelWindow.of("2026-12-24", "2026-12-27"), GWANGJU)).toHaveLength(1);
  });

  it("이틀 연휴는 차로 2시간 30분 안만 — 강릉은 빠진다", () => {
    expect(reachMinutes(2)).toBe(150);
    const twoDays = TravelWindow.of("2026-12-26", "2026-12-27");
    expect(
      codes(twoDays, [
        festival("강릉", GANGNEUNG, "2026-12-26", "2026-12-27"),
        festival("파주", PAJU, "2026-12-26", "2026-12-27"),
      ]),
    ).toEqual(["파주"]);
  });

  it("출발지 동네(20km 안)는 축제가 많아도 뺀다", () => {
    const JUNG_GU = new Coordinate(37.5638, 126.9976); // 서울 중구, 약 2km
    expect(
      codes(threeDays, [
        festival("서울 중구", JUNG_GU, "2026-12-01", "2026-12-31"),
        festival("서울 중구", JUNG_GU, "2026-12-01", "2026-12-31"),
        festival("파주", PAJU, "2026-12-25", "2026-12-25"),
      ]),
    ).toEqual(["파주"]);
  });

  it("지역 안 축제는 연휴와 오래 겹치는 순", () => {
    const [d] = recommendDestinations(
      [
        festival("파주", PAJU, "2026-12-27", "2026-12-31"), // 1일
        festival("파주", PAJU, "2026-12-01", "2026-12-31"), // 3일
      ],
      threeDays,
      SEOUL,
    );
    expect(d.festivals.map((f) => threeDays.overlapDays(f.start, f.end))).toEqual([3, 1]);
  });

  it("최대 limit 곳까지만", () => {
    const many = Array.from({ length: 8 }, (_, i) => festival(`지역${i}`, PAJU, "2026-12-25", "2026-12-25"));
    expect(recommendDestinations(many, threeDays, SEOUL, 5)).toHaveLength(5);
  });
});

describe("얼마나 멀리 — 사용자가 고른 거리", () => {
  it("가까운 곳만은 차로 1시간 30분, 멀어도 괜찮으면 한 단계 넓힌다", () => {
    expect([2, 3, 5].map((d) => reachMinutes(d, "near"))).toEqual([90, 90, 90]);
    expect([2, 3, 5].map((d) => reachMinutes(d, "far"))).toEqual([390, Infinity, Infinity]);
    expect([2, 3, 5].map((d) => reachMinutes(d))).toEqual([150, 390, Infinity]);
  });

  it("사흘 연휴에 가까운 곳만 고르면 강릉(차로 약 2시간 50분)은 빠지고 파주만", () => {
    const threeDays = TravelWindow.of("2026-12-25", "2026-12-27");
    const list = [festival("강릉", GANGNEUNG, "2026-12-25", "2026-12-25"), festival("파주", PAJU, "2026-12-25", "2026-12-25")];
    expect(recommendDestinations(list, threeDays, SEOUL, 5, "near").map((d) => d.region.code)).toEqual(["파주"]);
  });

  it("멀어도 괜찮아도 제주는 나흘 이상일 때만", () => {
    const jeju = [festival("50-110", JEJU, "2026-12-01", "2027-01-31")];
    expect(recommendDestinations(jeju, TravelWindow.of("2026-12-25", "2026-12-27"), SEOUL, 5, "far")).toEqual([]);
  });

  it("모르는 값은 기본(auto)", () => {
    expect(reachPreferenceOf("far")).toBe("far");
    expect(reachPreferenceOf("아무거나")).toBe("auto");
    expect(reachPreferenceOf(undefined)).toBe("auto");
  });
});
