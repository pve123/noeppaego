import { describe, expect, it } from "vitest";
import { isChainBranch, isMeal } from "./restaurant-filters";

describe("isChainBranch", () => {
  it("이름 끝이 「…점」이면 체인 지점", () => {
    expect(isChainBranch("맥도날드 해운대DT점")).toBe(true);
    expect(isChainBranch("전설의우대갈비 해운대직영점")).toBe(true);
    expect(isChainBranch("노랑통닭 운정1호점")).toBe(true);
  });

  it("「본점」으로 끝나거나 한 낱말 이름이면 남긴다", () => {
    expect(isChainBranch("남향막국수 본점")).toBe(false);
    expect(isChainBranch("그린식탁 운정본점")).toBe(false);
    expect(isChainBranch("오복돼지국밥")).toBe(false);
    expect(isChainBranch("명경막국수")).toBe(false);
  });
});

describe("isMeal", () => {
  it("카페·술집·간식은 끼니가 아니다", () => {
    expect(isMeal("음식점 > 한식 > 국밥")).toBe(true);
    expect(isMeal("음식점 > 카페")).toBe(false);
    expect(isMeal("음식점 > 간식 > 제과,베이커리")).toBe(false);
    expect(isMeal("음식점 > 술집 > 호프,요리주점")).toBe(false);
  });
});
