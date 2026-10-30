"use client";

import type { ReactNode, RefObject } from "react";

/**
 * 아래에서 올라오는 시트(휴대폰)·가운데 창(넓은 화면) — 브라우저 기본 dialog 라 Esc·바깥 누르기·닫기 버튼으로 닫히고 초점이 갇힌다.
 * 여는 쪽이 ref 로 showModal() 을 부른다. 열려 있는 동안 뒤 화면은 globals.css 가 스크롤을 막는다.
 */
export function Sheet({
  dialogRef,
  titleId,
  title,
  children,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  titleId: string;
  title: ReactNode;
  children: ReactNode;
}) {
  const close = () => dialogRef.current?.close();
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // 바깥(어두운 곳)을 누르면 닫는다
      onClick={(e) => e.target === e.currentTarget && close()}
      className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-3xl border-[3px] border-b-0 border-ink bg-cream p-0 text-ink shadow-pop backdrop:bg-ink/50 sm:inset-0 sm:m-auto sm:max-w-md sm:rounded-3xl sm:border-b-[3px]"
    >
      <div className="px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/20 sm:hidden" />
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="flex min-w-0 items-center gap-2 font-display text-[20px]">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-2xl text-ink/60 hover:bg-ink/5 hover:text-ink"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
