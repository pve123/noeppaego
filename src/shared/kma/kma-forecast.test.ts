import { describe, expect, it } from "vitest";
import { latestMidBase, latestShortBase, midHalfDays, shortHalfDay, shortTemps, type ShortItem } from "./kma-forecast";

const at = (time: string, category: string, value: string): ShortItem => ({
  category,
  fcstDate: "20261027",
  fcstTime: time,
  fcstValue: value,
});

describe("shortHalfDay", () => {
  it("강수확률은 가장 높은 값, 하늘은 가장 많은 상태", () => {
    const items = [at("0900", "POP", "20"), at("1000", "POP", "30"), at("0900", "SKY", "3"), at("1000", "SKY", "3"), at("1100", "SKY", "1")];
    expect(shortHalfDay(items, "20261027", "0600", "1100")).toEqual({ rainChance: 30, sky: "구름많음" });
  });

  it("비가 한 시간이라도 있으면 비, 흐림과 같이 오면 「흐리고 비」", () => {
    const items = [at("1300", "POP", "70"), at("1300", "PTY", "1"), at("1300", "SKY", "4"), at("1400", "PTY", "0"), at("1400", "SKY", "4")];
    expect(shortHalfDay(items, "20261027", "1200", "1800")).toEqual({ rainChance: 70, sky: "흐리고 비" });
  });

  it("그 시간대 예보가 없으면(이미 지났으면) undefined", () => {
    expect(shortHalfDay([at("1300", "POP", "10")], "20261027", "0600", "1100")).toBeUndefined();
  });

  it("최저·최고 기온은 반올림", () => {
    expect(shortTemps([at("0600", "TMN", "2.0"), at("1500", "TMX", "13.4")], "20261027")).toEqual({ min: 2, max: 13 });
  });
});

describe("midHalfDays", () => {
  // 2026-10-26 06시 발표 서울·인천·경기 실제 응답 일부
  const item = { rnSt4Am: 60, rnSt4Pm: 20, wf4Am: "흐리고 비", wf4Pm: "구름많음", rnSt8: 10, wf8: "맑음" };

  it("7일 뒤까지는 오전·오후 따로", () => {
    expect(midHalfDays(item, 4)).toEqual({
      am: { rainChance: 60, sky: "흐리고 비" },
      pm: { rainChance: 20, sky: "구름많음" },
    });
  });

  it("8일 뒤부터는 하루 값 하나를 오전·오후에 같이", () => {
    expect(midHalfDays(item, 8)).toEqual({ am: { rainChance: 10, sky: "맑음" }, pm: { rainChance: 10, sky: "맑음" } });
  });
});

describe("발표 시각", () => {
  const kst = (iso: string) => new Date(`${iso}+09:00`);

  it("단기예보는 발표 15분 뒤부터 쓴다", () => {
    expect(latestShortBase(kst("2026-10-26T14:10:00"))).toEqual({ baseDate: "20261026", baseTime: "1100" });
    expect(latestShortBase(kst("2026-10-26T14:20:00"))).toEqual({ baseDate: "20261026", baseTime: "1400" });
  });

  it("새벽 2시 15분 전이면 전날 23시 발표", () => {
    expect(latestShortBase(kst("2026-10-26T01:00:00"))).toEqual({ baseDate: "20261025", baseTime: "2300" });
  });

  it("중기예보는 06·18시 발표, 새벽이면 전날 18시", () => {
    expect(latestMidBase(kst("2026-10-26T13:57:00"))).toBe("202610260600");
    expect(latestMidBase(kst("2026-10-26T19:00:00"))).toBe("202610261800");
    expect(latestMidBase(kst("2026-10-26T05:00:00"))).toBe("202610251800");
  });
});
