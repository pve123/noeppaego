const EARTH_RADIUS_KM = 6371;

/** 위경도(값 객체). 거리는 직선 거리(하버사인) — 길 따라 가는 거리·시간이 아니다. */
export class Coordinate {
  constructor(
    readonly lat: number,
    readonly lng: number,
  ) {}

  distanceKm(other: Coordinate): number {
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = rad(other.lat - this.lat);
    const dLng = rad(other.lng - this.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(this.lat)) * Math.cos(rad(other.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
  }

  static centerOf(points: readonly Coordinate[]): Coordinate {
    const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
    return new Coordinate(lat, lng);
  }
}

/** 출발지 기본값 — 서울시청 */
export const SEOUL = new Coordinate(37.5665, 126.978);
