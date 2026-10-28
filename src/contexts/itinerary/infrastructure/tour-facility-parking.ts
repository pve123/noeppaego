import "server-only";
import { ContentType, fetchIntroParking, type ContentTypeId } from "@/shared/tour-api/tour-api";
import { FacilityParking, FacilityParkingSource, PlaceKind } from "../domain/place";

/** 주차 칸이 있는 종류만 — 축제(15)는 칸이 없고 식당은 카카오에서 찾는다 */
const TYPE_OF: Partial<Record<PlaceKind, ContentTypeId>> = {
  sight: ContentType.sight,
  culture: ContentType.culture,
  lodging: ContentType.lodging,
};
/** 너무 긴 안내는 줄인다 — 시트 한 칸에 들어갈 만큼 */
const MAX_LENGTH = 80;

/** 관광공사가 적은 글을 한 줄로 — `<br>`·태그를 띄어쓰기로, 흔한 엔티티를 글자로, 겹친 공백을 하나로 */
export function cleanIntroText(raw: string): string {
  const text = raw
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 1)}…` : text;
}

/** 관광공사 장소(tour:…)의 시설 주차 안내. 실패는 tour-api 가 warn 으로 남겼다 */
export class TourFacilityParking implements FacilityParkingSource {
  async parkingOf(placeId: string, kind: PlaceKind): Promise<FacilityParking | undefined> {
    const type = TYPE_OF[kind];
    if (!type || !placeId.startsWith("tour:")) return undefined;
    const result = await fetchIntroParking(placeId.slice("tour:".length), type);
    if (!result.ok) return undefined;
    const text = cleanIntroText(result.value.parking);
    const fee = cleanIntroText(result.value.fee);
    return text ? { text, fee: fee || undefined } : undefined;
  }
}
