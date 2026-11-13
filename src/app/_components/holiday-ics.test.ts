import { describe, expect, it } from "vitest";
import type { BreakOptionView, LongBreakView } from "@/contexts/calendar";
import { holidayCalendar } from "./holiday-ics";

const option = (startIso: string, endIso: string, length: number, leaveLabels: string[] = []): BreakOptionView => ({
  startIso,
  endIso,
  startLabel: startIso.replaceAll("-", "."),
  endLabel: endIso.replaceAll("-", "."),
  length,
  leaveCount: leaveLabels.length,
  leaveLabels,
  days: [],
});

const seollal: LongBreakView = {
  key: "2027-02-06",
  month: 2,
  title: "설날",
  status: { kind: "upcoming", daysLeft: 86 },
  base: option("2027-02-06", "2027-02-09", 4),
  extensions: [option("2027-02-06", "2027-02-14", 9, ["2027.02.10(수)", "2027.02.11(목)", "2027.02.12(금)"])],
};

const ics = holidayCalendar([seollal], "https://noeppaego.com", new Date("2026-11-12T03:04:05Z"));
/** 접힌 줄을 다시 펴서 본다 */
const unfolded = ics.replace(/\r\n /g, "");

describe("holidayCalendar", () => {
  it("줄은 CRLF 로 끝나고 75바이트를 넘지 않는다", () => {
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  it("연휴를 하루 종일 일정으로 — 끝날은 하루 뒤", () => {
    expect(unfolded).toContain("DTSTART;VALUE=DATE:20270206");
    expect(unfolded).toContain("DTEND;VALUE=DATE:20270210");
    expect(unfolded).toContain("UID:break-2027-02-06@noeppaego.com");
    expect(unfolded).toContain("DTSTAMP:20261112T030405Z");
  });

  it("제목은 연휴 이름과 날수, 설명에는 연차로 늘리는 방법과 갈 곳 고르기 링크", () => {
    expect(unfolded).toContain("SUMMARY:설날 연휴 4일");
    expect(unfolded).toContain(
      "DESCRIPTION:2027.02.06부터 2027.02.09까지 연차 없이 4일 쉬어요.\\n2027.02.06부터 2027.02.14까지 연차 3개(2027.02.10(수)\\, 2027.02.11(목)\\, 2027.02.12(금)) 쓰면 9일 쉬어요.\\n\\n갈 곳 고르기: https://noeppaego.com/breaks/2027-02-06",
    );
  });

  it("연차가 있어야 이어지는 연휴는 제목에 연차 수를 붙인다", () => {
    const withLeave = { ...seollal, base: option("2027-05-01", "2027-05-05", 5, ["2027.05.04(화)"]) };
    expect(holidayCalendar([withLeave], "https://example.com", new Date(0)).replace(/\r\n /g, "")).toContain(
      "SUMMARY:설날 연휴 5일 (연차 1개)",
    );
  });

  it("제목에서 같은 연휴를 다시 부르는 대체공휴일은 뺀다", () => {
    const sam = { ...seollal, title: "삼일절과 대체공휴일(삼일절)" };
    expect(holidayCalendar([sam], "https://example.com", new Date(0)).replace(/\r\n /g, "")).toContain("SUMMARY:삼일절 연휴 4일");
  });
});
