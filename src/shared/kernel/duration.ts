/** 화면용 이동 시간 — 「약 2시간 10분」「약 12분」. 5분 단위로 반올림(10분 미만은 그대로). */
export function durationLabel(minutes: number): string {
  const rounded = minutes < 10 ? Math.max(1, Math.round(minutes)) : Math.round(minutes / 5) * 5;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (hours === 0) return `약 ${rest}분`;
  return rest === 0 ? `약 ${hours}시간` : `약 ${hours}시간 ${rest}분`;
}
