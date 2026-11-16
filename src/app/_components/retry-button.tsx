"use client";

/** 지금 화면을 다시 불러온다 — 잠깐 끊긴 연결이면 대개 이것으로 풀린다 */
export function RetryButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => location.reload()} className={className}>
      다시 해 보기
    </button>
  );
}
