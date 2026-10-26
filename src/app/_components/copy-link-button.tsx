"use client";

import { useState } from "react";

/** 지금 페이지 주소를 복사한다 — 공유 페이지에서 */
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(location.href.replace(/[?&]saved=1/, ""));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          prompt("이 주소를 복사해 주세요", location.href);
        }
      }}
      className="inline-flex h-11 items-center rounded-full border-[2.5px] border-cream bg-yellow px-5 font-display text-[17px] text-ink"
    >
      {copied ? "복사했어요" : "링크 복사"}
    </button>
  );
}
