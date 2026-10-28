"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 두 줄로 줄인 글 — 실제로 잘렸을 때만 「더보기」를 붙이고, 누르면 펼친다.
 * 잘렸는지는 화면 폭에 따라 달라서 ResizeObserver 로 잰다.
 */
export function ClampText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const observer = new ResizeObserver(() => setOverflowing(el.scrollHeight > el.clientHeight + 1));
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, text]);

  return (
    <div className={className}>
      <p ref={ref} className={open ? "" : "line-clamp-2"}>
        {text}
      </p>
      {(overflowing || open) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-0.5 text-[13px] font-bold text-ink underline decoration-ink/30 decoration-2 underline-offset-4 hover:decoration-ink"
        >
          {open ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}
