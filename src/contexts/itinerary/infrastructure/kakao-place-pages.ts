import "server-only";
import { cacheLife } from "next/cache";
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
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    cacheLife("seconds");
    return undefined;
  }
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", title.replace(/\([^)]*\)/g, "").trim() || normalizeName(title));
  url.searchParams.set("category_group_code", "AD5");
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));
  url.searchParams.set("radius", "500");
  url.searchParams.set("sort", "distance");
  url.searchParams.set("size", "5");
  try {
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(5_000) });
    if (!res.ok) {
      console.warn(`[kakao:place-page] 응답 ${res.status}`);
      cacheLife("minutes");
      return undefined;
    }
    const { documents } = (await res.json()) as { documents: KakaoDoc[] };
    const match = documents.find((d) => isSamePlace(title, d.place_name, Number(d.distance)));
    if (match) cacheLife("hours");
    else cacheLife("minutes");
    return match?.place_url;
  } catch (e) {
    console.warn(`[kakao:place-page] 연결 실패: ${(e as Error).name}`);
    cacheLife("minutes");
    return undefined;
  }
}

export class KakaoPlacePages implements PlacePages {
  async kakaoPageOf(place: Place): Promise<string | undefined> {
    return findKakaoPage(place.title, Math.round(place.location.lat * 1e5) / 1e5, Math.round(place.location.lng * 1e5) / 1e5);
  }
}
