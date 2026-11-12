import { connection, type NextRequest } from "next/server";
import { CalendarDate, findLongBreaks } from "@/contexts/calendar";
import { holidayCalendar } from "../_components/holiday-ics";

/**
 * 연휴 구독 캘린더 — 구글·애플 캘린더에 이 주소를 「구독」으로 넣으면 올해와 내년 연휴가 들어온다.
 * 공휴일(천문연)만 쓰고 카카오 자료는 쓰지 않아 응답을 캐시해도 된다. 캘린더 앱은 보통 몇 시간에서 하루마다 다시 받아 간다.
 */
export async function GET(request: NextRequest) {
  await connection(); // 「오늘」은 요청 시각 기준 — 빌드할 때 미리 만들지 않는다
  const today = CalendarDate.todayIn("Asia/Seoul", new Date());
  try {
    const years = await Promise.all([today.year, today.year + 1].map((year) => findLongBreaks({ year, today })));
    const breaks = years.flatMap((y) => y.breaks);
    return new Response(holidayCalendar(breaks, request.nextUrl.origin, new Date()), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="holidays.ics"',
        // CDN 이 하루 동안 같은 응답을 준다 — 구독한 사람이 늘어도 공휴일 API 호출은 늘지 않는다
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (e) {
    // 공휴일을 못 받으면 빈 캘린더를 주지 않는다 — 빈 캘린더를 받으면 구독한 앱이 연휴를 모두 지운다
    console.warn(`[holidays.ics] 연휴를 만들지 못했다: ${(e as Error).name}`);
    return new Response("잠시 뒤 다시 시도해 주세요.", { status: 503, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } });
  }
}
