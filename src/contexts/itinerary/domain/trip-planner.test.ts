import { describe, expect, it } from "vitest";
import { Coordinate } from "@/shared/kernel/coordinate";
import { Place } from "./place";
import { draftTrip, fillMeals, fillStays, layoutOf, mealsOf, slotKeyOf, TripDay } from "./trip-planner";

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

  it("비 오는 반나절에는 실내 장소를 고르고 표시한다 — 축제는 그대로", () => {
    const museum = place("박물관", 30, { kind: "culture", indoor: true });
    const rainyMorning = (date: string, time: string) => date === "2026-12-26" && time === "morning";
    const days = draftTrip(dates, [place("A", 0), place("B", 1), place("C", 2), museum], [], rainyMorning);
    const morning = days[1].slots[0];
    expect(morning.kind === "visit" && morning.place.id).toBe("박물관");
    expect(morning.kind === "visit" && morning.forRain).toBe(true);
    const afternoon = days[1].slots.find((s) => s.time === "afternoon");
    expect(afternoon?.kind === "visit" && afternoon.forRain).toBeUndefined();

    const festival = place("축제", 5, { kind: "festival", period: { start: "2026-12-26", end: "2026-12-26" } });
    const withFestival = draftTrip(dates, [place("A", 0), museum], [festival], rainyMorning);
    const festivalMorning = withFestival[1].slots[0];
    expect(festivalMorning.kind === "visit" && festivalMorning.place.id).toBe("축제");
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

describe("사용자가 고른 곳(picks)", () => {
  const dates = ["2026-12-25", "2026-12-26", "2026-12-27"];
  const sights = [place("A", 0), place("B", 1), place("C", 2), place("D", 3), place("E", 20)];

  it("관광지 칸을 고른 곳으로 고정하고 뒤 동선은 거기서 이어 간다", () => {
    const picks = new Map([[slotKeyOf("2026-12-26", "morning"), "E"]]);
    const days = draftTrip(dates, sights, [], () => false, picks);
    const morning = days[1].slots[0];
    expect(morning.kind === "visit" && morning.place.id).toBe("E");
    expect(morning.kind === "visit" && morning.picked).toBe(true);
  });

  it("다른 칸이 고른 곳을 먼저 가져가지 않는다", () => {
    // B 는 원래 둘째 날 오전에 들어갈 곳 — 셋째 날 오전으로 옮겨 달라고 하면 둘째 날엔 다른 곳이 들어간다
    const picks = new Map([[slotKeyOf("2026-12-27", "morning"), "B"]]);
    const ids = draftTrip(dates, sights, [], () => false, picks)
      .flatMap((d) => d.slots)
      .flatMap((s) => (s.kind === "visit" ? [s.place.id] : []));
    expect(ids.filter((id) => id === "B")).toHaveLength(1);
    expect(ids.at(-1)).toBe("B");
  });

  it("목록에 없는 곳을 골랐으면 그 칸은 자동으로 고른다", () => {
    const picks = new Map([[slotKeyOf("2026-12-25", "afternoon"), "없는곳"]]);
    const days = draftTrip(dates, sights, [], () => false, picks);
    const afternoon = days[0].slots.find((s) => s.time === "afternoon");
    expect(afternoon?.kind === "visit" && afternoon.place.id).toBe("A");
  });

  it("관광지 칸마다 일정에 안 들어간 근처 볼거리를 바꿀 후보로 준다", () => {
    const days = draftTrip(dates, sights, [], () => false);
    const visit = days[0].slots.find((s) => s.kind === "visit");
    const used = days.flatMap((d) => d.slots).flatMap((s) => (s.kind === "visit" ? [s.place.id] : []));
    expect(visit?.kind === "visit" && visit.alternatives.map((p) => p.id)).toEqual(["E"]);
    expect(used).not.toContain("E");
  });

  it("식사 칸을 고른 식당으로 바꾸면 원래 식당은 후보로 내려간다", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 10)], []);
    const near = [place("국밥", 0.1, { kind: "restaurant" }), place("파스타", 0.5, { kind: "restaurant" })];
    const picks = new Map([[slotKeyOf("2026-12-25", "lunch"), "파스타"]]);
    const [lunch] = mealsOf(fillMeals(days, [near, []], 2, picks));
    expect(lunch.choice?.id).toBe("파스타");
    expect(lunch.picked).toBe(true);
    expect(lunch.alternatives.map((p) => p.id)).toEqual(["국밥"]);
  });

  it("다른 끼니가 고른 식당을 이 끼니가 먼저 가져가지 않는다", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 0.2)], []);
    const shared = [place("국밥", 0.1, { kind: "restaurant" }), place("파스타", 0.3, { kind: "restaurant" })];
    const picks = new Map([[slotKeyOf("2026-12-25", "dinner"), "국밥"]]);
    const [lunch, dinner] = mealsOf(fillMeals(days, [shared, shared], 2, picks));
    expect(lunch.choice?.id).toBe("파스타");
    expect(dinner.choice?.id).toBe("국밥");
  });
});
