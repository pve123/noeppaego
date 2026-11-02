import "server-only";
import { cacheFor } from "@/shared/cache";
import { Coordinate } from "@/shared/kernel/coordinate";
import { kakaoGet } from "@/shared/kakao/kakao-rest";
import { AreaNames } from "../domain/origin";

type Region = { region_type: "B" | "H"; region_2depth_name: string; region_3depth_name: string };

/**
 * 카카오 로컬 좌표 → 행정구역(coord2regioncode). 「종로구」처럼 시·군·구 이름을 준다(없으면 동 이름).
 * 좌표는 이미 약 1km 로 줄인 값이라 같은 동네는 캐시를 같이 쓴다. 키(KAKAO_REST_API_KEY)는 서버에서만 쓴다.
 */
async function areaNameAt(lat: number, lng: number): Promise<string | undefined> {
  "use cache";
  const result = await kakaoGet<{ documents: Region[] }>("kakao:area", "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json", { x: lng, y: lat });
  cacheFor(result.ok, "days");
  if (!result.ok) return undefined;
  const region = result.data.documents.find((d) => d.region_type === "H") ?? result.data.documents[0];
  // 「수원시 영통구」처럼 두 단어면 뒤(구)만 — 칩에 짧게
  return region?.region_2depth_name.split(" ").at(-1) || region?.region_3depth_name || undefined;
}

export class KakaoAreaNames implements AreaNames {
  nameAt(at: Coordinate): Promise<string | undefined> {
    return areaNameAt(at.lat, at.lng);
  }
}
