import type { MetadataRoute } from "next";

/**
 * 웹 앱 매니페스트 — 휴대폰 「홈 화면에 추가」와 안드로이드 앱(TWA) 포장에 쓴다.
 * 아이콘 PNG 는 src/app/icon.svg(튜브 타고 쉬는 뇌)를 옮긴 것. maskable 은 배경을 꽉 채우고 안드로이드가 모양대로 잘라도 그림이 남게 그림을 64% 로 줄여 가운데 안전 영역 안에 그렸다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "뇌빼고",
    short_name: "뇌빼고",
    description: "공휴일과 주말을 이어서 연차는 적게 쓰고 오래 쉬는 날을 찾아 드려요.",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf5ec",
    theme_color: "#faf5ec",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      // 테마 아이콘(안드로이드 13+) — 투명도만 쓰는 단색 실루엣
      { src: "/art/icon-monochrome.png", sizes: "432x432", type: "image/png", purpose: "monochrome" },
    ],
    // 아이콘을 길게 누르면 나오는 바로가기 — 안드로이드 앱(android/app/build.gradle)과 같은 세 개
    shortcuts: [
      { name: "다음 연휴 보기", short_name: "다음 연휴", url: "/#next", icons: [{ src: "/art/shortcuts/next.png", sizes: "192x192", type: "image/png" }] },
      { name: "연휴 목록", short_name: "연휴 목록", url: "/#breaks", icons: [{ src: "/art/shortcuts/breaks.png", sizes: "192x192", type: "image/png" }] },
      { name: "찜한 일정", short_name: "찜한 일정", url: "/saved", icons: [{ src: "/art/shortcuts/saved.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
