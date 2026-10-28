"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 다른 페이지로 넘어가면 맨 위에서 시작한다.
 * Next 는 새 페이지가 화면에 보이면 스크롤 위치를 그대로 두는데, 새 페이지는 짧은 뼈대부터 그려서
 * 목록 아래쪽 카드를 누르면 뼈대의 푸터(정보 출처)부터 보였다.
 * 뒤로·앞으로 가기(브라우저가 위치를 되살린다)와 같은 페이지 안 바꾸기(주소만 바뀜)는 건드리지 않는다.
 * #앵커(예: /#breaks)로 넘어가면 그 자리가 늦게 그려져(Suspense) 브라우저가 못 찾으니, 그려질 때까지 잠깐 기다렸다 그리로 간다.
 */
const ANCHOR_WAIT_MS = 4000;
export function ScrollToTop() {
  const pathname = usePathname();
  const first = useRef(true);
  const history = useRef(false);

  useEffect(() => {
    const onPop = () => {
      history.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (history.current) {
      history.current = false;
      return;
    }
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    let frame = 0;
    const until = performance.now() + ANCHOR_WAIT_MS;
    const seek = () => {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ block: "start" });
      else if (performance.now() < until) frame = requestAnimationFrame(seek);
    };
    seek();
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
