/**
 * 지금 어떤 기기·어떤 창에서 보고 있는지 — 브라우저에서만 알 수 있다(서버에서는 모두 false).
 * 설치 안내, Play 받기 버튼, 내비 앱 열기가 같이 쓴다.
 */

const userAgent = () => (typeof navigator === "undefined" ? "" : navigator.userAgent);

export const isAndroid = () => /Android/i.test(userAgent());

/** 아이폰·아이패드 — 요즘 아이패드는 맥처럼 자기를 소개해서 터치 여부로 가린다 */
export const isIOS = () =>
  /iPhone|iPad|iPod/i.test(userAgent()) || (/Macintosh/.test(userAgent()) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1);

const APP_KEY = "ht_twa";

/**
 * 앱(TWA)이나 홈 화면에 둔 웹앱으로 열었는지.
 * 앱은 첫 화면에서만 referrer 가 android-app:// 이라 그때 이 탭에 적어 두고, 다른 화면에서도 그 표시를 본다.
 */
export function inApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (document.referrer.startsWith("android-app://")) sessionStorage.setItem(APP_KEY, "1");
    if (sessionStorage.getItem(APP_KEY) === "1") return true;
  } catch {
    // 저장소가 막혀 있으면 화면 모드만 본다
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
