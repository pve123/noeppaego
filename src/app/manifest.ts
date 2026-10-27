import type { MetadataRoute } from "next";

/**
 * 웹 앱 매니페스트 — 휴대폰 「홈 화면에 추가」와 안드로이드 앱(TWA) 포장에 쓴다.
 * 아이콘 PNG 는 src/app/icon.svg 를 그대로 옮긴 것. maskable 은 안드로이드가 모양대로 잘라도 그림이 남게 가운데 72% 안에 그렸다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "연휴 여행 플래너",
    short_name: "연휴 여행",
    description: "공휴일과 주말을 이어서 연차는 적게 쓰고 오래 쉬는 날을 찾아 드려요.",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffbea",
    theme_color: "#fffbea",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
