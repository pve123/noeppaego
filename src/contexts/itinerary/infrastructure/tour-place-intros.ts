import "server-only";
import { fetchOverview } from "@/shared/tour-api/tour-api";
import { Place, PlaceIntros } from "../domain/place";
import { firstSentence } from "./first-sentence";

/** 관광공사 장소(tour:…)의 소개 첫 문장. 카카오 식당 등 다른 곳은 소개가 없다 — 실패는 tour-api 가 warn 으로 남겼다 */
export class TourPlaceIntros implements PlaceIntros {
  async introOf(place: Place): Promise<string | undefined> {
    if (!place.id.startsWith("tour:")) return undefined;
    const result = await fetchOverview(place.id.slice("tour:".length));
    return result.ok ? firstSentence(result.value) : undefined;
  }
}
