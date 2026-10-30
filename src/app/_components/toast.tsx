"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** 서버 액션이 돌아오며 붙인 표시(?saved=1, ?fav=on|off) → 띄울 한 줄 */
const MESSAGES: Record<string, Record<string, string>> = {
  saved: { "1": "저장했어요! 카톡으로 보내거나 캘린더에 추가해 보세요" },
  fav: { on: "찜했어요", off: "찜을 풀었어요" },
};
const SHOW_MS = 2600;

/**
 * 저장·찜을 마쳤을 때 아래에서 잠깐 올라오는 알림 + 짧은 진동(안드로이드) — 눌렀다는 확신을 준다.
 * 다 보이면 표시를 주소에서 지운다(새로고침·공유 때 다시 뜨지 않게). 상태 없이 주소만 본다.
 */
export function Toast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const found = Object.keys(MESSAGES).find((key) => MESSAGES[key][params.get(key) ?? ""]);
  const message = found && MESSAGES[found][params.get(found)!];

  useEffect(() => {
    if (!found) return;
    navigator.vibrate?.(12);
    const timer = setTimeout(() => {
      const rest = new URLSearchParams(params);
      rest.delete(found);
      router.replace(rest.size > 0 ? `${pathname}?${rest}` : pathname, { scroll: false });
    }, SHOW_MS);
    return () => clearTimeout(timer);
  }, [found, params, pathname, router]);

  if (!message) return null;
  return (
    <p
      role="status"
      className="toast fixed inset-x-4 bottom-[max(24px,env(safe-area-inset-bottom))] z-[60] mx-auto flex w-fit max-w-[calc(100%-32px)] items-center gap-2 rounded-full border-[2.5px] border-ink bg-surface px-5 py-3 text-[15px] font-bold text-ink shadow-pop"
    >
      <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-mint text-[12px] text-ink">
        ✓
      </span>
      {message}
    </p>
  );
}
