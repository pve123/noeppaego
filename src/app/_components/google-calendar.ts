export type CalendarTrip = {
  /** 「경기도 파주시 2박 3일 · 성탄절 연휴」 */
  title: string;
  /** 첫날 YYYY-MM-DD — 일정은 연휴 첫날부터 날수만큼 이어진다 */
  startIso: string;
  regionName: string;
  days: { dayNumber: number; dateLabel: string; slots: { timeLabel: string; place?: { title: string } }[] }[];
  /** 공유 링크(절대 주소) — 설명 끝에 붙인다 */
  url: string;
};

/**
 * 구글 캘린더 「일정 추가」 주소 — 여행 기간 하루 종일 일정 하나. 날마다 갈 곳은 설명에 적는다.
 * 로그인이나 권한 없이 보는 사람의 캘린더에 넣는 화면을 연다(저장은 그 사람이 누른다).
 */
export function googleCalendarUrl(trip: CalendarTrip): string {
  const details = [
    ...trip.days.map((day) =>
      [
        `${day.dayNumber}일차 ${day.dateLabel}`,
        ...day.slots.flatMap((s) => (s.place ? [`${s.timeLabel} ${s.place.title}`] : [])),
      ].join("\n"),
    ),
    `일정 자세히 보기: ${trip.url}`,
  ].join("\n\n");
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: trip.title,
    // 하루 종일 일정은 끝날을 하루 뒤(포함하지 않음)로 적는다
    dates: `${compact(trip.startIso, 0)}/${compact(trip.startIso, trip.days.length)}`,
    details,
    location: trip.regionName,
  });
  return `https://calendar.google.com/calendar/render?${query}`;
}

/** `2026-12-25` + n일 → `20261227` */
function compact(iso: string, plusDays: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + plusDays);
  return d.toISOString().slice(0, 10).replaceAll("-", "");
}
