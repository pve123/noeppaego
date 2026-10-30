import "server-only";
import { cacheLife } from "next/cache";
import { Coordinate } from "@/shared/kernel/coordinate";
import { AreaNames } from "../domain/origin";

type Region = { region_type: "B" | "H"; region_2depth_name: string; region_3depth_name: string };

/**
 * 카카오 로컬 좌표 → 행정구역(coord2regioncode). 「종로구」처럼 시·군·구 이름을 준다(없으면 동 이름).
 * 좌표는 이미 약 1km 로 줄인 값이라 같은 동네는 캐시를 같이 쓴다. 키(KAKAO_REST_API_KEY)는 서버에서만 쓴다.
 */
async function areaNameAt(lat: number, lng: number): Promise<string | undefined> {
  "use cache";
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    cacheLife("seconds");
    return undefined;
  }
  const url = new URL("https://dapi.kakao.com/v2/local/geo/coord2regioncode.json");
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));
  try {
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(5_000) });
    if (!res.ok) {
      console.warn(`[kakao:area] 응답 ${res.status}`);
      cacheLife("seconds");
      return undefined;
    }
    const { documents } = (await res.json()) as { documents: Region[] };
    const region = documents.find((d) => d.region_type === "H") ?? documents[0];
    cacheLife("days");
    // 「수원시 영통구」처럼 두 단어면 뒤(구)만 — 칩에 짧게
    return region?.region_2depth_name.split(" ").at(-1) || region?.region_3depth_name || undefined;
  } catch (e) {
    console.warn(`[kakao:area] 연결 실패: ${(e as Error).name}`);
    cacheLife("seconds");
    return undefined;
  }
}

export class KakaoAreaNames implements AreaNames {
  nameAt(at: Coordinate): Promise<string | undefined> {
    return areaNameAt(at.lat, at.lng);
  }
}
