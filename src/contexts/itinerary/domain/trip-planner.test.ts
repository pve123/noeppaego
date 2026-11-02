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
  it("첫날은 점심부터, 마지막 날은 점심 먹고 귀가 — 매일 점심 뒤엔 카페", () => {
    expect(layoutOf(0, 3)).toEqual(["lunch", "cafe", "afternoon", "dinner", "night"]);
    expect(layoutOf(1, 3)).toEqual(["morning", "lunch", "cafe", "afternoon", "dinner", "night"]);
    expect(layoutOf(2, 3)).toEqual(["morning", "lunch", "cafe", "home"]);
    expect(layoutOf(0, 1)).toEqual(["morning", "lunch", "cafe", "afternoon", "dinner", "home"]);
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
    expect(times(days[2])).toEqual(["morning", "lunch", "cafe", "home"]);
    expect(times(days[0]).at(-1)).toBe("night");
  });
});

describe("fillMeals", () => {
  it("걸어갈 만한 곳(1km) 안에서는 가까운 곳보다 많이 찾는 곳(앞 순서)을 고른다", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 10)], []);
    const popularButFarther = place("인기", 0.8, { kind: "restaurant" }); // 약 720m
    const closest = place("가까움", 0.1, { kind: "restaurant" });
    const [lunch] = mealsOf(fillMeals(days, [[popularButFarther, closest], [], []]));
    expect(lunch.choice?.id).toBe("인기");
  });

  it("1km 밖은 가까운 순 — 걸어갈 만한 곳이 없으면 가장 가까운 곳", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 10)], []);
    const [lunch] = mealsOf(fillMeals(days, [[place("멀다", 3, { kind: "restaurant" }), place("덜 멀다", 1.5, { kind: "restaurant" })], [], []]));
    expect(lunch.choice?.id).toBe("덜 멀다");
  });

  it("같은 날 저녁은 점심과 다른 메뉴부터 — 「한식」처럼 넓은 분류는 따지지 않는다", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 10)], []);
    const lunch = [place("해장국집", 0.1, { kind: "restaurant", category: "해장국" })];
    const dinner = [
      place("또 해장국", 10.1, { kind: "restaurant", category: "해장국" }),
      place("막국수집", 10.2, { kind: "restaurant", category: "막국수" }),
    ];
    const [, , d] = mealsOf(fillMeals(days, [lunch, [], dinner]));
    expect(d.choice?.id).toBe("막국수집");

    const broad = [place("한식1", 0.1, { kind: "restaurant", category: "한식" })];
    const broadDinner = [place("한식2", 10.1, { kind: "restaurant", category: "한식" }), place("한식3", 10.2, { kind: "restaurant", category: "한식" })];
    expect(mealsOf(fillMeals(days, [broad, [], broadDinner]))[2].choice?.id).toBe("한식2");
  });

  it("가장 가까운 곳을 고르고, 이미 고른 곳(같은 이름 포함)은 다음 끼니에 다시 고르지 않는다", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 10)], []);
    const near = [place("국밥", 0.1, { kind: "restaurant" }), place("파스타", 0.5, { kind: "restaurant" })];
    const sameNameOtherBranch = place("국밥-2", 10.1, { kind: "restaurant", title: "국밥" });
    const filled = fillMeals(days, [near, [], [sameNameOtherBranch, place("냉면", 10.3, { kind: "restaurant" })]]);
    const [lunch, , dinner] = mealsOf(filled);
    expect(lunch.choice?.id).toBe("국밥");
    expect(lunch.alternatives.map((p) => p.id)).toEqual(["파스타"]);
    expect(dinner.choice?.id).toBe("냉면");
  });
});

describe("카페 칸", () => {
  it("점심과 같은 근처에서 찾고, 고르는 방식은 식사 칸과 같다", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 10)], []);
    const [lunch, cafe] = mealsOf(days);
    expect(cafe.time).toBe("cafe");
    expect(cafe.near).toEqual(lunch.near);

    const cafes = [place("디저트", 0.2, { kind: "cafe" }), place("베이커리", 0.4, { kind: "cafe" })];
    const [, filled] = mealsOf(fillMeals(days, [[place("국밥", 0.1, { kind: "restaurant" })], cafes, []], 2));
    expect(filled.choice?.id).toBe("디저트");
    expect(filled.alternatives.map((p) => p.id)).toEqual(["베이커리"]);
  });

  it("고른 카페는 그 칸에 고정한다", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 10)], []);
    const cafes = [place("디저트", 0.2, { kind: "cafe" }), place("베이커리", 0.4, { kind: "cafe" })];
    const picks = new Map([[slotKeyOf("2026-12-25", "cafe"), "베이커리"]]);
    const [, cafe] = mealsOf(fillMeals(days, [[], cafes, []], 2, picks));
    expect(cafe.choice?.id).toBe("베이커리");
    expect(cafe.picked).toBe(true);
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

  it("축제 칸을 다른 곳으로 바꾸면 축제는 빠지고 다음 칸으로 밀려나지 않는다", () => {
    const festival = place("축제", 40, { kind: "festival", period: { start: "2026-12-26", end: "2026-12-27" } });
    const before = visitIds(draftTrip(dates, sights, [festival]));
    expect(before[1][0]).toBe("morning:축제");
    const picks = new Map([[slotKeyOf("2026-12-26", "morning"), "E"]]);
    const after = visitIds(draftTrip(dates, sights, [festival], () => false, picks));
    expect(after[1][0]).toBe("morning:E");
    expect(after.flat().some((v) => v.endsWith(":축제"))).toBe(false);
  });

  it("식사 칸 후보에는 다른 끼니가 이미 쓰는 식당을 넣지 않는다", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 0.2)], []);
    const shared = ["R1", "R2", "R3", "R4"].map((id, i) => place(id, 0.1 * (i + 1), { kind: "restaurant" }));
    const [lunch, , dinner] = mealsOf(fillMeals(days, [shared, [], shared], 3));
    expect(lunch.choice?.id).toBe("R1");
    expect(dinner.choice?.id).toBe("R2");
    expect(lunch.alternatives.map((p) => p.id)).toEqual(["R3", "R4"]);
  });

  it("고른 식당이 근처가 바뀌어 후보에서 빠졌으면 다른 끼니가 써도 된다", () => {
    const days = draftTrip(["2026-12-25"], [place("A", 0), place("B", 0.2)], []);
    const near = [place("국밥", 0.1, { kind: "restaurant" }), place("파스타", 0.3, { kind: "restaurant" })];
    const picks = new Map([[slotKeyOf("2026-12-25", "dinner"), "국밥"]]);
    const [lunch] = mealsOf(fillMeals(days, [near, []], 2, picks));
    expect(lunch.choice?.id).toBe("국밥");
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
    const [lunch, , dinner] = mealsOf(fillMeals(days, [shared, [], shared], 2, picks));
    expect(lunch.choice?.id).toBe("파스타");
    expect(dinner.choice?.id).toBe("국밥");
  });
});

describe("fillStays — 종류와 바꾸기", () => {
  const days = () =>
    draftTrip(["2026-12-25", "2026-12-26", "2026-12-27"], [place("A", 0), place("B", 1), place("C", 2), place("D", 3)], []);
  const lodging = (id: string, x: number, rank: number) => place(id, x, { kind: "lodging", rank });
  const stays = (filled: TripDay[]) => filled.flatMap((d) => d.slots).filter((s) => s.kind === "stay");

  it("15km 안이면 가까운 모텔보다 조금 먼 호텔을 먼저 고르고, 다음 후보 둘을 바꾸기로 준다", () => {
    const filled = fillStays(days(), [lodging("모텔", 0.3, 3), lodging("호텔", 4, 0), lodging("펜션", 2, 1), lodging("한옥", 6, 0)]);
    const [first] = stays(filled);
    expect(first.kind === "stay" && first.choice?.id).toBe("호텔");
    expect(first.kind === "stay" && first.alternatives?.map((p) => p.id)).toEqual(["한옥", "펜션"]);
  });

  it("고른 숙소는 그 밤에만 두고 다른 밤은 그대로다", () => {
    const filled = fillStays(days(), [lodging("모텔", 0.3, 3), lodging("호텔", 4, 0)], new Map([[slotKeyOf("2026-12-25", "night"), "모텔"]]));
    const [first, second] = stays(filled);
    expect(first.kind === "stay" && first.choice?.id).toBe("모텔");
    expect(first.kind === "stay" && first.picked).toBe(true);
    expect(second.kind === "stay" && second.choice?.id).toBe("호텔");
    expect(second.kind === "stay" && second.picked).toBeUndefined();
  });

  it("둘째 밤만 바꿀 수도 있다", () => {
    const filled = fillStays(days(), [lodging("모텔", 0.3, 3), lodging("호텔", 4, 0)], new Map([[slotKeyOf("2026-12-26", "night"), "모텔"]]));
    expect(stays(filled).map((s) => s.kind === "stay" && s.choice?.id)).toEqual(["호텔", "모텔"]);
  });
});
