"use client";

import { useSyncExternalStore } from "react";
import { CHIP } from "./button-styles";
import { inApp, isIOS } from "./device";

/** 플레이 스토어 앱 주소 — 안드로이드에서는 Play 스토어 앱이 열린다 */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.hosunglee.holidaytrip";

/** 받을 수 있는 기기인지 — 앱 안이 아니고 아이폰이 아니면 */
const canGetApp = () => !inApp() && !isIOS();
/** 기기는 보는 동안 바뀌지 않는다 — 구독할 것이 없다 */
const neverChanges = () => () => {};

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
 * 기기는 브라우저에서만 알 수 있다 — 서버가 그린 화면에는 없고, 브라우저에서 이어받을 때 나타난다.
 */
export function PlayStoreLink({ className = CHIP, label = "Google Play에서 받기" }: { className?: string; label?: string }) {
  const show = useSyncExternalStore(neverChanges, canGetApp, () => false);
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
