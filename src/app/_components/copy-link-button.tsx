"use client";

import { useState } from "react";

/** 지금 페이지 주소를 복사한다 — 공유 페이지에서 */
export function CopyLinkButton({ className }: { className: string }) {
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
      className={className}
    >
      {copied ? "복사했어요" : "링크 공유"}
    </button>
  );
}
