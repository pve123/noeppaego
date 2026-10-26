import { describe, expect, it } from "vitest";
import { Coordinate } from "@/shared/kernel/coordinate";
import { Place } from "./place";
import { draftTrip, fillMeals, fillStays, layoutOf, mealsOf, TripDay } from "./trip-planner";

// 경도 0.01 ≈ 0.9km — x 값으로 동서 위치만 다르게 둔다.
const at = (x: number) => new Coordinate(37.7, 126.7 + x * 0.01);
const place = (id: string, x: number, extra: Partial<Place> = {}): Place => ({
  id,
  kind: "sight",
  title: id,
  location: at(x),
  address: "",
  indoor: false,
  ...extra,
});

const visitIds = (days: TripDay[]) =>
  days.map((d) => d.slots.flatMap((s) => (s.kind === "visit" ? [`${s.time}:${s.place.id}`] : [])));
const times = (day: TripDay) => day.slots.map((s) => s.time);

describe("layoutOf", () => {
  it("첫날은 점심부터, 마지막 날은 점심 먹고 귀가", () => {
    expect(layoutOf(0, 3)).toEqual(["lunch", "afternoon", "dinner", "night"]);
    expect(layoutOf(1, 3)).toEqual(["morning", "lunch", "afternoon", "dinner", "night"]);
    expect(layoutOf(2, 3)).toEqual(["morning", "lunch", "home"]);
    expect(layoutOf(0, 1)).toEqual(["morning", "lunch", "afternoon", "dinner", "home"]);
  });
});

describe("draftTrip", () => {
  const dates = ["2026-12-25", "2026-12-26", "2026-12-27"];

  it("처음은 목록 맨 앞, 다음부터는 바로 앞 방문지에서 가까운 곳", () => {
    const days = draftTrip(dates, [place("A", 0), place("far", 50), place("B", 1), place("C", 2), place("D", 3)], []);
    expect(visitIds(days)).toEqual([["afternoon:A"], ["morning:B", "afternoon:C"], ["morning:D"]]);
  });

  it("그날 열리는 축제를 그날 첫 방문지로 먼저 넣는다", () => {
    const festival = place("축제", 40, { kind: "festival", period: { start: "2026-12-26", end: "2026-12-26" } });
    const days = draftTrip(dates, [place("A", 0), place("B", 1), place("C", 2), place("D", 3)], [festival]);
    expect(visitIds(days)[1][0]).toBe("morning:축제");
    expect(visitIds(days)[0]).toEqual(["afternoon:A"]); // 25일엔 축제가 없다
  });

  it("같은 곳을 두 번 넣지 않고, 모자라면 칸을 뺀다", () => {
    const days = draftTrip(dates, [place("A", 0), place("B", 1)], []);
    expect(visitIds(days)).toEqual([["afternoon:A"], ["morning:B"], []]);
  });

  it("점심은 앞 방문지, 앞이 없으면 뒤 방문지 근처", () => {
    const days = draftTrip(dates, [place("A", 0), place("B", 5), place("C", 6), place("D", 7)], []);
    const [firstLunch] = mealsOf([days[0]]);
    expect(firstLunch.near).toEqual(at(0)); // 첫날 점심 — 앞이 없어 오후(A) 근처
    const secondLunch = mealsOf([days[1]])[0];
    expect(secondLunch.near).toEqual(at(5)); // 둘째 날 점심 — 오전(B) 근처
  });

  it("볼 곳이 하나도 없으면 일정을 짜지 않는다", () => {
    expect(draftTrip(dates, [], [])).toEqual([]);
  });

  it("마지막 날은 귀가로 끝나고 숙소가 없다", () => {
    const days = draftTrip(dates, [place("A", 0), place("B", 1), place("C", 2), place("D", 3)], []);
    expect(times(days[2])).toEqual(["morning", "lunch", "home"]);
    expect(times(days[0]).at(-1)).toBe("night");
  });
});

describe("fillMeals", () => {
  it("가장 가까운 곳을 고르고, 이미 고른 곳(같은 이름 포함)은 다음 끼니에 다시 고르지 않는다", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 10)], []);
    const near = [place("국밥", 0.1, { kind: "restaurant" }), place("파스타", 0.5, { kind: "restaurant" })];
    const sameNameOtherBranch = place("국밥-2", 10.1, { kind: "restaurant", title: "국밥" });
    const filled = fillMeals(days, [near, [sameNameOtherBranch, place("냉면", 10.3, { kind: "restaurant" })]]);
    const [lunch, dinner] = mealsOf(filled);
    expect(lunch.choice?.id).toBe("국밥");
    expect(lunch.alternatives.map((p) => p.id)).toEqual(["파스타"]);
    expect(dinner.choice?.id).toBe("냉면");
  });
});

describe("fillStays", () => {
  it("첫 밤 근처 숙소 한 곳에 매일 묵는다", () => {
    const days = draftTrip(
      ["2026-12-25", "2026-12-26", "2026-12-27"],
      [place("A", 0), place("B", 1), place("C", 2), place("D", 3)],
      [],
    );
    const filled = fillStays(days, [place("먼 호텔", 30, { kind: "lodging" }), place("가까운 펜션", 0.2, { kind: "lodging" })]);
    const stays = filled.flatMap((d) => d.slots).filter((s) => s.kind === "stay");
    expect(stays).toHaveLength(2);
    expect(stays.every((s) => s.kind === "stay" && s.choice?.id === "가까운 펜션")).toBe(true);
  });
});
