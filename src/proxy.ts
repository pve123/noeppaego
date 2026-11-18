import { NextResponse, type NextRequest } from "next/server";

/**
 * 무거운 화면을 로봇에게서 지킨다 — 일정 화면과 조건 붙은 연휴 화면은 열 때마다 바깥 API(관광공사 등)를 많이 부른다.
 * robots.txt 를 따르지 않는 수집 로봇도 있어, 이름(User-Agent)이 로봇이면 데이터를 부르기 전에 403 으로 돌려보낸다.
 * 링크 미리보기 로봇(카카오톡·페이스북 등)은 공유 일정(/t/…)만 보므로 여기서는 막지 않는다(matcher 밖).
 */
const BOT = /bot\b|bot\/|crawl|spider|slurp|yeti|daumoa|bingpreview|gptbot|chatgpt|claude|anthropic|perplexity|bytespider|amazonbot|applebot|petalbot|semrush|ahrefs|mj12|dotbot|python-requests|python-urllib|go-http-client|curl\/|wget|okhttp|scrapy|headlesschrome/i;

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // 연휴 화면(/breaks/날짜)은 조건이 없을 때만 로봇에게 연다 — 검색에 나오는 기본 화면이다
  const heavy = pathname.split("/").filter(Boolean).length >= 3 || search.length > 0;
  if (!heavy) return NextResponse.next();

  const ua = request.headers.get("user-agent") ?? "";
  if (ua && !BOT.test(ua)) return NextResponse.next();

  console.info(`[bot-blocked] ${pathname}${search} ua=${ua.slice(0, 120) || "(없음)"}`);
  return new NextResponse("이 화면은 사람만 볼 수 있어요.", {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex, nofollow" },
  });
}

export const config = {
  matcher: ["/breaks/:start/:path*"],
};
