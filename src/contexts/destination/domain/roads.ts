import { Coordinate } from "@/shared/kernel/coordinate";

/**
 * 포트 — 출발 도시에서 시·군·구까지 미리 계산해 둔 차 경로(오픈스트리트맵 도로, 막히지 않을 때 기준).
 * 모르는 곳(내 위치 출발, 섬, 아직 계산하지 않은 출발 도시)은 undefined — 부르는 쪽이 직선 거리로 어림한다.
 */
export interface Roads {
  /** 지역 대표 좌표(시청·군청 근처) — 지도 핀과 경로 끝이 여기서 만난다 */
  pointOf(regionCode: string): Coordinate | undefined;
  /** 차로 걸리는 시간(분) */
  minutesTo(regionCode: string): number | undefined;
  /** 도로 모양(출발지 → 지역 대표 좌표) */
  pathTo(regionCode: string): readonly Coordinate[] | undefined;
}

export interface RoadTables {
  forOrigin(originId: string): Promise<Roads>;
}

export const NO_ROADS: Roads = { pointOf: () => undefined, minutesTo: () => undefined, pathTo: () => undefined };
