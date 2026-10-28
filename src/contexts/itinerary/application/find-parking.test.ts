import { describe, expect, it } from "vitest";
import { Coordinate } from "@/shared/kernel/coordinate";
import { findParking } from "./find-parking";

const lot = (name: string, distanceM: number) => ({ name, address: "", location: new Coordinate(37.5, 127), distanceM });

describe("findParking", () => {
  it("가까운 순 세 곳만, 거리는 걸어서 몇 분으로(최소 1분)", async () => {
    const finder = { near: async () => [lot("A", 20), lot("B", 134), lot("C", 400), lot("D", 450)] };
    const views = await findParking(new Coordinate(37.5, 127), finder);
    expect(views.map((v) => [v.name, v.walkMinutes])).toEqual([
      ["A", 1],
      ["B", 2],
      ["C", 6],
    ]);
  });

  it("주차대행·발렛 업체와 같은 이름은 뺀다", async () => {
    const finder = { near: async () => [lot("인천공항 주차대행", 10), lot("A", 20), lot("A", 20), lot("발렛파킹", 30), lot("B", 60)] };
    const views = await findParking(new Coordinate(37.5, 127), finder);
    expect(views.map((v) => v.name)).toEqual(["A", "B"]);
  });
});
