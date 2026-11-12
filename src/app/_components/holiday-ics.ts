import type { BreakOptionView, LongBreakView } from "@/contexts/calendar";

/**
 * 연휴 구독 캘린더(iCalendar, RFC 5545) — 연휴마다 하루 종일 일정 하나.
 * 연차로 늘리는 방법은 일정을 따로 만들지 않고 설명에 적는다. 캘린더가 연휴로 가득 차지 않게.
 */
export function holidayCalendar(breaks: readonly LongBreakView[], origin: string, now: Date): string {
  const stamp = `${now.toISOString().slice(0, 19).replace(/[-:]/g, "")}Z`;
  const host = new URL(origin).host;
  const events = breaks.flatMap((b) => [
    "BEGIN:VEVENT",
    `UID:break-${b.key}@${host}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(b.base.startIso, 0)}`,
    // 하루 종일 일정의 끝날은 포함하지 않는다 — 마지막 날 다음 날로 적는다
    `DTEND;VALUE=DATE:${compact(b.base.endIso, 1)}`,
    `SUMMARY:${text(summaryOf(b))}`,
    `DESCRIPTION:${text(descriptionOf(b, origin))}`,
    `URL:${origin}/breaks/${b.key}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ]);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//계획은 J가//연휴//KO`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${text("계획은 J가 연휴")}`,
    "X-WR-TIMEZONE:Asia/Seoul",
    // 구독한 앱이 하루에 한 번 새로 받아 가게(대체공휴일 발표 등)
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
    "X-PUBLISHED-TTL:P1D",
    ...events,
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n")
    .concat("\r\n");
}

/**
 * 「설날 연휴 4일」, 연차가 있어야 이어지면 「설날 연휴 5일 (연차 1개)」.
 * 캘린더 칸은 좁아서 「삼일절과 대체공휴일(삼일절)」의 대체공휴일은 뺀다(같은 연휴를 두 번 부르는 말이다).
 */
function summaryOf(b: LongBreakView): string {
  const name = b.title.replace(/[과와] 대체공휴일\([^)]*\)/g, "");
  const leave = b.base.leaveCount > 0 ? ` (연차 ${b.base.leaveCount}개)` : "";
  return `${name} 연휴 ${b.base.length}일${leave}`;
}

function descriptionOf(b: LongBreakView, origin: string): string {
  return [
    `${b.base.startLabel}부터 ${b.base.endLabel}까지 ${howTo(b.base)}`,
    ...b.extensions.map((o) => `${o.startLabel}부터 ${o.endLabel}까지 ${howTo(o)}`),
    "",
    `갈 곳 고르기: ${origin}/breaks/${b.key}`,
  ].join("\n");
}

/** 「연차 없이 4일 쉬어요.」 「연차 2개(2027.02.10(수), 2027.02.11(목)) 쓰면 9일 쉬어요.」 */
function howTo(o: BreakOptionView): string {
  if (o.leaveCount === 0) return `연차 없이 ${o.length}일 쉬어요.`;
  return `연차 ${o.leaveCount}개(${o.leaveLabels.join(", ")}) 쓰면 ${o.length}일 쉬어요.`;
}

/** `2026-12-25` + n일 → `20261226` */
function compact(iso: string, plusDays: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + plusDays);
  return d.toISOString().slice(0, 10).replaceAll("-", "");
}

/** TEXT 값 — 역슬래시, 쌍반점, 쉼표, 줄바꿈을 이스케이프한다 */
function text(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** 한 줄은 75바이트까지 — 넘으면 줄을 바꾸고 공백 하나로 잇는다. 한글이 바이트 중간에서 잘리지 않게 글자 단위로 자른다 */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // 이어지는 줄은 앞의 공백 한 바이트를 뺀다
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}
