import { Coordinate } from "@/shared/kernel/coordinate";
import type { RoadTables, Roads } from "../domain/roads";
import regions from "./drive-routes/regions.json";

/** scripts/build-drive-routes.mjs 가 만든 표 — 길이 없으면 null */
type SavedRoutes = Record<string, { minutes: number; path: [number, number][] } | null>;
const points = regions as Record<string, { name: string; lat: number; lng: number }>;

/**
 * 미리 계산한 차 경로(drive-routes/*.json)를 읽는 도로 표. 실행 중에는 길찾기를 부르지 않는다.
 * 출발 도시 파일이 없으면(내 위치, 아직 계산하지 않은 도시) 대표 좌표만 알려 준다.
 */
export class StaticRoadTables implements RoadTables {
  async forOrigin(originId: string): Promise<Roads> {
    const saved = await load(originId);
    return {
      pointOf: (code) => (points[code] ? new Coordinate(points[code].lat, points[code].lng) : undefined),
      minutesTo: (code) => saved?.[code]?.minutes,
      pathTo: (code) => saved?.[code]?.path.map(([lat, lng]) => new Coordinate(lat, lng)),
    };
  }
}

async function load(originId: string): Promise<SavedRoutes | undefined> {
  if (!/^[a-z]+$/.test(originId)) return undefined; // 내 위치(`here:…`)는 표가 없다
  try {
    return (await import(`./drive-routes/${originId}.json`)).default as SavedRoutes;
  } catch {
    return undefined;
  }
}
