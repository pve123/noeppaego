"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/**
 * 누르면 크게 보는 사진 — 브라우저 기본 dialog 라 Esc·바깥 누르기·닫기 버튼으로 닫히고 키보드로도 쓸 수 있다.
 * @param title 크게 볼 때 사진 아래 이름이자 버튼의 읽는 이름
 */
export function ZoomableImage({ src, title, className }: { src: string; title: string; className: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`${title} 사진 크게 보기`}
        // self-start: 옆 글이 「더보기」로 길어져도 버튼이 늘어나지 않게 — 늘어나면 버튼이 사진을 가운데로 내린다
        className="shrink-0 self-start cursor-zoom-in rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-offset-4"
      >
        {/* 사진이 오기 전에는 그 자리가 반짝이고, 오면 반짝임을 끈다 */}
        <Image
          src={src}
          alt=""
          width={160}
          height={160}
          unoptimized
          onLoad={() => setLoaded(true)}
          className={`${loaded ? "" : "shimmer"} ${className}`}
        />
      </button>

      <dialog
        ref={dialog}
        aria-label={`${title} 사진`}
        // 사진 바깥(어두운 곳)을 누르면 닫는다
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto max-h-[90vh] w-[min(92vw,960px)] overflow-visible bg-transparent p-0 backdrop:bg-ink/80"
      >
        <figure className="overflow-hidden rounded-3xl border border-cream bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element -- 원본 크기를 모르는 바깥 사진이라 img 로 맞춘다 */}
          <img src={src} alt={title} className="max-h-[75vh] w-full bg-ink object-contain" />
          <figcaption className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="font-display text-lg">{title}</span>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="h-11 shrink-0 rounded-full border border-ink/15 bg-yellow px-5 font-display text-[17px]"
            >
              닫기
            </button>
          </figcaption>
        </figure>
      </dialog>
    </>
  );
}
