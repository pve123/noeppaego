import "server-only";
import { cacheFor } from "@/shared/cache";
import { kakaoGet } from "@/shared/kakao/kakao-rest";
import { Place, PlacePages } from "../domain/place";
import { isSamePlace, normalizeName } from "./place-match";

type KakaoDoc = { place_name: string; place_url: string; distance: string };

/**
 * 관광공사 장소의 카카오맵 페이지(별점·리뷰) — 이름으로 카카오 장소 검색(숙박 AD5, 그 자리 반경 500m)을 해서
 * 같은 곳(place-match)이 있으면 주소를 준다. 키(KAKAO_REST_API_KEY)는 서버에서만 쓴다.
 * 찾은 결과는 몇 시간, 못 찾음·실패는 몇 분만 캐시한다(장소 이름이 고쳐지면 다시 찾게).
 */
async function findKakaoPage(title: string, lat: number, lng: number): Promise<string | undefined> {
  "use cache";
  const result = await kakaoGet<{ documents: KakaoDoc[] }>("kakao:place-page", "https://dapi.kakao.com/v2/local/search/keyword.json", {
    query: title.replace(/\([^)]*\)/g, "").trim() || normalizeName(title),
    category_group_code: "AD5",
    x: lng,
    y: lat,
    radius: 500,
    sort: "distance",
    size: 5,
  });
  const match = result.ok ? result.data.documents.find((d) => isSamePlace(title, d.place_name, Number(d.distance))) : undefined;
  // 찾은 결과는 몇 시간, 못 찾음·실패는 몇 분만(장소 이름이 고쳐지면 다시 찾게)
  cacheFor(match !== undefined, "hours", "minutes");
  return match?.place_url;
}

export class KakaoPlacePages implements PlacePages {
  async kakaoPageOf(place: Place): Promise<string | undefined> {
    return findKakaoPage(place.title, Math.round(place.location.lat * 1e5) / 1e5, Math.round(place.location.lng * 1e5) / 1e5);
  }
}
