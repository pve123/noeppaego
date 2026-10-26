import { describe, expect, it } from "vitest";
import { DayOutline, TripWriter } from "../domain/trip-writer";
import { describeItinerary } from "./describe-itinerary";
import { ItineraryView } from "./plan-itinerary";

const plan: ItineraryView = {
  regionName: "경기도 파주시",
  customized: false,
  lengthLabel: "1박 2일",
  startLabel: "12.26(토)",
  endLabel: "12.27(일)",
  days: [1, 2].map((dayNumber) => ({
    dayNumber,
    dateLabel: `12.2${5 + dayNumber}`,
    slots: [
      {
        key: `d${dayNumber}`,
        time: "lunch",
        timeLabel: "점심",
        alternatives: [],
        place: { id: `p${dayNumber}`, title: `식당${dayNumber}`, address: "", lat: 0, lng: 0, indoor: true },
      },
      { key: `h${dayNumber}`, time: "home", timeLabel: "귀가", alternatives: [], note: "집으로 출발" },
    ],
  })),
};

const writer = (result: string[] | undefined, seen: DayOutline[][] = []): TripWriter => ({
  async describe(_region, days) {
    seen.push([...days]);
    return result;
  },
});

describe("describeItinerary", () => {
  it("장소가 있는 칸만 줄거리로 넘긴다", async () => {
    const seen: DayOutline[][] = [];
    await describeItinerary(plan, writer(["a", "b"], seen));
    expect(seen[0][0].stops).toEqual([{ time: "점심", title: "식당1", category: undefined, indoor: true }]);
  });

  it("날 수만큼 글이 오면 그대로, 모자라면 버린다", async () => {
    expect(await describeItinerary(plan, writer(["첫날", "둘째 날"]))).toEqual(["첫날", "둘째 날"]);
    expect(await describeItinerary(plan, writer(["첫날"]))).toBeUndefined();
    expect(await describeItinerary(plan, writer(undefined))).toBeUndefined();
  });
});
