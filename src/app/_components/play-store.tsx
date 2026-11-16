"use client";

import { useEffect, useState } from "react";
import { CHIP } from "./button-styles";

/** 플레이 스토어 앱 주소 — 안드로이드에서는 Play 스토어 앱이 열린다 */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.hosunglee.holidaytrip";

const TWA_KEY = "ht_twa";

/**
 * 앱(TWA) 안이나 홈 화면에 둔 웹앱으로 열렸는지.
 * TWA 는 첫 화면의 referrer 가 android-app:// 이라 그때 이 탭에 표시해 두고, 다른 화면에서도 그 표시를 본다.
 */
export function inApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (document.referrer.startsWith("android-app://")) sessionStorage.setItem(TWA_KEY, "1");
    if (sessionStorage.getItem(TWA_KEY) === "1") return true;
  } catch {
    // 저장소가 막혀 있으면 화면 모드만 본다
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

/** 플레이 스토어 삼각형 — 단색(currentColor) */
function PlayIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 ${className}`} fill="currentColor">
      <path d="M5 3.6v16.8a1 1 0 0 0 1.5.86l14.2-8.4a1 1 0 0 0 0-1.72L6.5 2.74A1 1 0 0 0 5 3.6z" />
    </svg>
  );
}

/**
 * 「Google Play에서 받기」 링크 — 앱 안이나 아이폰에서는 보이지 않는다(받을 수 없거나 이미 받았다).
 * 모양은 놓는 곳이 정한다 — 첫 화면은 옆 버튼과 같은 행동 버튼, 바닥글은 칩(기본).
 * 기기는 브라우저에서만 알 수 있어 그린 뒤에 나타난다. 서버와 첫 화면은 비어 있다.
 */
export function PlayStoreLink({ className = CHIP, label = "Google Play에서 받기" }: { className?: string; label?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // 기기 판별은 브라우저에서만 — 그린 뒤 한 번
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(!inApp() && !isIOS());
  }, []);
  if (!show) return null;
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <PlayIcon className="size-[0.9em]" />
      {label}
    </a>
  );
}
