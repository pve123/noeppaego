import "server-only";
import { ContentType, fetchHomepage, fetchIntroParking, type ContentTypeId } from "@/shared/tour-api/tour-api";
import { FacilityParking, FacilityParkingSource, PlaceKind } from "../domain/place";

/** 주차 칸이 있는 종류 — 카페도 관광공사에서는 음식점(39)이다. 축제(15)는 칸이 없어 따로 안내한다 */
const TYPE_OF: Partial<Record<PlaceKind, ContentTypeId>> = {
  sight: ContentType.sight,
  culture: ContentType.culture,
  lodging: ContentType.lodging,
  restaurant: ContentType.restaurant,
  cafe: ContentType.restaurant,
};

/** 축제 주차는 관광공사 칸이 없고 해마다 바뀐다 — 일반 안내와 축제 홈페이지로 보낸다 */
const FESTIVAL_PARKING = "축제 기간에는 임시 주차장이나 셔틀이 생기는 경우가 많아요.";
/** 너무 긴 안내는 줄인다 — 시트 한 칸에 들어갈 만큼 */
const MAX_LENGTH = 80;

/** 관광공사 homepage 칸에서 첫 http(s) 주소 — 태그·따옴표·꺾쇠 앞에서 끊는다. 없으면 undefined */
export const homepageOf = (raw: string) => raw.match(/https?:\/\/[^\s"'<>]+/)?.[0];

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
    if (!placeId.startsWith("tour:")) return undefined;
    if (kind === "festival") {
      const homepage = await fetchHomepage(placeId.slice("tour:".length));
      return { text: FESTIVAL_PARKING, homepage: homepage.ok ? homepageOf(homepage.value) : undefined, general: true };
    }
    const type = TYPE_OF[kind];
    if (!type) return undefined;
    const result = await fetchIntroParking(placeId.slice("tour:".length), type);
    if (!result.ok) return undefined;
    const text = cleanIntroText(result.value.parking);
    const fee = cleanIntroText(result.value.fee);
    return text ? { text, fee: fee || undefined } : undefined;
  }
}
