import "server-only";
import { Coordinate } from "@/shared/kernel/coordinate";
import { kakaoGet } from "@/shared/kakao/kakao-rest";
import { AreaNames } from "../domain/origin";

type Region = { region_type: "B" | "H"; region_2depth_name: string; region_3depth_name: string };

/**
 * 카카오 로컬 좌표 → 행정구역(coord2regioncode). 「종로구」처럼 시·군·구 이름을 준다(없으면 동 이름).
 * 결과는 캐시·보관하지 않는다(카카오 약관) — 「내 위치로」로 화면을 열 때마다 새로 부른다. 키(KAKAO_REST_API_KEY)는 서버에서만 쓴다.
 */
async function areaNameAt(lat: number, lng: number): Promise<string | undefined> {
  const result = await kakaoGet<{ documents: Region[] }>("kakao:area", "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json", { x: lng, y: lat });
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
