"use client";

import { useEffect } from "react";

/**
 * 오프라인 화면용 서비스 워커(public/sw.js)를 등록한다.
 * 개발 서버에서는 등록하지 않는다 — 한 번 붙으면 브라우저에 남아 화면 새로고침을 헷갈리게 한다.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // 등록 실패는 오프라인 화면만 못 보는 것 — 사이트는 그대로 쓴다.
    });
  }, []);
  return null;
}
