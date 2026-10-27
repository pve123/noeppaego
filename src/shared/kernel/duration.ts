/** 길은 직선보다 돌아간다 — 동네 길 기준 대략 1.4배 */
const ROAD_FACTOR = 1.4;
/** 시내·관광지 주변 평균 차 속도(km/h) */
const LOCAL_KMH = 30;
/** 출발·주차에 드는 시간(분) */
const OVERHEAD_MINUTES = 2;

/**
 * 길찾기를 못 했을 때 직선 거리로 어림한 차 이동 시간(분) — 같은 날 장소끼리(수 km)를 염두에 둔 값.
 * 화면은 길찾기 결과와 같은 「차로 약 N분」으로 보여 줘 한 화면에 두 형식이 섞이지 않게 한다.
 */
export function estimateDriveMinutes(straightKm: number): number {
  return (straightKm * ROAD_FACTOR * 60) / LOCAL_KMH + OVERHEAD_MINUTES;
}

/** 화면용 이동 시간 — 「약 2시간 10분」「약 12분」. 5분 단위로 반올림(10분 미만은 그대로). */
export function durationLabel(minutes: number): string {
  const rounded = minutes < 10 ? Math.max(1, Math.round(minutes)) : Math.round(minutes / 5) * 5;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (hours === 0) return `약 ${rest}분`;
  return rest === 0 ? `약 ${hours}시간` : `약 ${hours}시간 ${rest}분`;
}
