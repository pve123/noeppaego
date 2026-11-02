/**
 * 내비 앱으로 길찾기 — 카카오맵·네이버 지도·티맵을 목적지가 찍힌 채로 연다.
 * 안드로이드(앱 안 TWA 포함)는 intent 주소라 앱이 없으면 브라우저가 웹 길찾기로 넘어간다.
 * 아이폰은 앱 주소를 열어 보고, 잠시 뒤에도 화면이 그대로면(앱이 없으면) 웹 길찾기를 연다.
 * 앱 주소 형식은 각 앱이 공개한 URL 스킴을 따른다 — 실제 휴대폰에서 앱별로 확인이 필요하다.
 */

export type Destination = { name: string; lat: number; lng: number };
export type NavApp = "kakaomap" | "naver" | "tmap";

/** 네이버 지도가 부른 쪽을 알 수 있게 넘기는 값 — 앱 패키지 이름 */
const APP_NAME = "com.hosunglee.holidaytrip";
/** 아이폰에서 앱이 열리지 않았다고 볼 때까지 기다리는 시간(ms) */
const IOS_FALLBACK_MS = 1500;
const RECENT_KEY = "nav-app";

export const NAV_APPS: readonly { id: NavApp; label: string; androidPackage: string }[] = [
  { id: "kakaomap", label: "카카오맵", androidPackage: "net.daum.android.map" },
  { id: "naver", label: "네이버 지도", androidPackage: "com.nhn.android.nmap" },
  { id: "tmap", label: "티맵", androidPackage: "com.skt.tmap.ku" },
];

const name = (d: Destination) => encodeURIComponent(d.name.replaceAll(",", " "));

/** 웹 길찾기(카카오맵) — 앱이 없거나 PC 일 때 */
export const webRouteUrl = (d: Destination) => `https://map.kakao.com/link/to/${name(d)},${d.lat},${d.lng}`;

function appRouteUrl(app: NavApp, d: Destination): string {
  switch (app) {
    case "kakaomap":
      return `kakaomap://route?ep=${d.lat},${d.lng}&by=CAR`;
    case "naver":
      return `nmap://route/car?dlat=${d.lat}&dlng=${d.lng}&dname=${name(d)}&appname=${APP_NAME}`;
    case "tmap":
      return `tmap://route?goalname=${name(d)}&goalx=${d.lng}&goaly=${d.lat}`;
  }
}

const userAgent = () => (typeof navigator === "undefined" ? "" : navigator.userAgent);
const isAndroid = () => /Android/i.test(userAgent());
const isIOS = () => /iPhone|iPad|iPod/i.test(userAgent());
/** 휴대폰인지 — 내비 앱을 고를 수 있는 곳 */
export const canOpenNavApp = () => isAndroid() || isIOS();

export function openRoute(app: NavApp, d: Destination): void {
  rememberApp(app);
  const url = appRouteUrl(app, d);
  const web = webRouteUrl(d);
  if (isAndroid()) {
    const [scheme, rest] = url.split("://");
    const pkg = NAV_APPS.find((a) => a.id === app)!.androidPackage;
    location.href = `intent://${rest}#Intent;scheme=${scheme};package=${pkg};S.browser_fallback_url=${encodeURIComponent(web)};end`;
    return;
  }
  if (isIOS()) {
    location.href = url;
    setTimeout(() => {
      if (document.visibilityState === "visible") window.open(web, "_blank", "noopener");
    }, IOS_FALLBACK_MS);
    return;
  }
  window.open(web, "_blank", "noopener");
}

/** 마지막으로 고른 앱 — 저장소가 막혀 있어도(사생활 보호 창 등) 길찾기는 된다 */
export function recentApp(): NavApp | undefined {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    return NAV_APPS.some((a) => a.id === saved) ? (saved as NavApp) : undefined;
  } catch {
    return undefined;
  }
}

function rememberApp(app: NavApp): void {
  try {
    localStorage.setItem(RECENT_KEY, app);
  } catch {
    // 기억하지 못해도 길찾기는 된다
  }
}
