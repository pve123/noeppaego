import { describe, expect, it } from "vitest";
import { foodTagsOf, sightTagsOf } from "./place-tags";

describe("sightTagsOf", () => {
  it("관광공사 신분류 2단계, 없으면 1단계로", () => {
    expect(sightTagsOf("NA020900")).toEqual(["nature", "ocean"]);
    expect(sightTagsOf("VE020100")).toEqual(["activity", "themepark"]);
    expect(sightTagsOf("VE070100")).toEqual(["exhibit"]);
    expect(sightTagsOf("HS030100")).toEqual(["history"]);
    expect(sightTagsOf("SH060100")).toEqual(["shopping"]);
  });

  it("모르는 분류나 빈 값은 태그가 없다", () => {
    expect(sightTagsOf("VE110100")).toEqual([]);
    expect(sightTagsOf(undefined)).toEqual([]);
  });
});

describe("foodTagsOf", () => {
  it("카카오 분류 2단계로 음식 종류", () => {
    expect(foodTagsOf("음식점 > 중식 > 중국요리", "홍콩반점")).toEqual(["chinese"]);
    expect(foodTagsOf("음식점 > 한식 > 육류,고기 > 갈비", "원조갈비")).toEqual(["korean", "meat"]);
  });

  it("해산물은 분류 낱말 「회」나 상호로 — 「회관」은 해산물이 아니다", () => {
    expect(foodTagsOf("음식점 > 일식 > 회", "바다")).toEqual(["japanese", "seafood"]);
    expect(foodTagsOf("음식점 > 한식", "대구횟집")).toContain("seafood");
    expect(foodTagsOf("음식점 > 한식 > 한정식", "남도회관")).toEqual(["korean"]);
  });

  it("매운 음식은 상호·분류로 알 수 있는 것만", () => {
    expect(foodTagsOf("음식점 > 중식 > 중국요리", "라라마라탕")).toEqual(["chinese", "spicy"]);
    expect(foodTagsOf("음식점 > 분식 > 떡볶이", "신전떡볶이")).toEqual(["snack", "spicy"]);
  });
});
