"use client";

import Image from "next/image";
import { useRef } from "react";

/**
 * 누르면 크게 보는 사진 — 브라우저 기본 dialog 라 Esc·바깥 누르기·닫기 버튼으로 닫히고 키보드로도 쓸 수 있다.
 * @param title 크게 볼 때 사진 아래 이름이자 버튼의 읽는 이름
 */
export function ZoomableImage({ src, title, className }: { src: string; title: string; className: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`${title} 사진 크게 보기`}
        className="shrink-0 cursor-zoom-in rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-offset-4"
      >
        <Image src={src} alt="" width={160} height={160} unoptimized className={className} />
      </button>

      <dialog
        ref={dialog}
        aria-label={`${title} 사진`}
        // 사진 바깥(어두운 곳)을 누르면 닫는다
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto max-h-[90vh] w-[min(92vw,960px)] overflow-visible bg-transparent p-0 backdrop:bg-ink/80"
      >
        <figure className="overflow-hidden rounded-3xl border-[3px] border-cream bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element -- 원본 크기를 모르는 바깥 사진이라 img 로 맞춘다 */}
          <img src={src} alt={title} className="max-h-[75vh] w-full bg-ink object-contain" />
          <figcaption className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="font-display text-lg">{title}</span>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="h-11 shrink-0 rounded-full border-[2.5px] border-ink bg-yellow px-5 font-display text-[17px]"
            >
              닫기
            </button>
          </figcaption>
        </figure>
      </dialog>
    </>
  );
}
