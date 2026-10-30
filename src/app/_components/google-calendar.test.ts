import { describe, expect, it } from "vitest";
import { googleCalendarUrl } from "./google-calendar";

describe("googleCalendarUrl", () => {
  const slot = (timeLabel: string, title?: string) => ({ timeLabel, place: title ? { title } : undefined });
  const url = new URL(
    googleCalendarUrl({
      title: "경기도 파주시 2박 3일 · 성탄절 연휴",
      startIso: "2026-12-30",
      regionName: "경기도 파주시",
      days: [
        { dayNumber: 1, dateLabel: "2026.12.30(수)", slots: [slot("점심", "국밥집"), slot("숙소", "파주 호텔")] },
        { dayNumber: 2, dateLabel: "2026.12.31(목)", slots: [slot("오전", "임진각"), slot("저녁")] },
        { dayNumber: 3, dateLabel: "2027.01.01(금)", slots: [slot("귀가")] },
      ],
      url: "https://example.com/t/abc",
    }),
  );

  it("여행 기간을 하루 종일 일정으로 — 끝날은 하루 뒤, 해가 바뀌어도", () => {
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe("20261230/20270102");
  });

  it("설명에 날마다 장소가 있는 칸과 공유 링크를 적는다", () => {
    expect(url.searchParams.get("details")).toBe(
      "1일차 2026.12.30(수)\n점심 국밥집\n숙소 파주 호텔\n\n2일차 2026.12.31(목)\n오전 임진각\n\n3일차 2027.01.01(금)\n\n일정 자세히 보기: https://example.com/t/abc",
    );
  });
});
