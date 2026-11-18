import type { MetadataRoute } from "next";

/**
 * 검색 로봇 안내 — 첫 화면과 연휴 화면(/breaks/날짜)만 돌아보게 한다.
 * 일정 화면(/breaks/날짜/지역)은 열 때마다 관광공사 API 를 수십 번 부르고, 칸마다 「바꾸기」 링크가 새 주소를 만들어
 * 로봇이 따라가면 하루 한도가 금방 찬다(2026-11-17·18 실제로 찼다). 주소에 조건(?)이 붙은 화면도 같은 이유로 막는다.
 * 공유 일정(/t/…)은 막지 않는다 — 카카오톡 미리보기 로봇이 robots.txt 를 따라서, 막으면 링크 미리보기가 사라진다(페이지는 noindex).
 * 규칙을 무시하는 로봇은 proxy.ts 가 돌려보낸다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/breaks/*/", "/*?", "/saved", "/account", "/api/"],
    },
  };
}
