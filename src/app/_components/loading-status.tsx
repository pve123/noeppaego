"use client";

import { useEffect, useState } from "react";

/** 이만큼 지나면 「오래 걸리고 있어요」로 바꿔 멈춘 게 아니라고 알린다 */
const SLOW_AFTER_MS = 6000;
const STEP_MS = 1800;

/**
 * 지금 하는 일을 차례로 보여 주는 한 줄 — 스켈레톤 위에 둔다.
 * 화면 읽기 프로그램에도 전해진다(aria-live). 「움직임 줄이기」를 켜면 점 애니메이션만 멈춘다.
 */
export function LoadingStatus({ steps, tone = "light" }: { steps: string[]; tone?: "light" | "dark" }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - started), 300);
    return () => clearInterval(timer);
  }, []);

  const slow = elapsed >= SLOW_AFTER_MS;
  const step = steps[Math.min(Math.floor(elapsed / STEP_MS), steps.length - 1)];
  const text = slow ? "조금 오래 걸리고 있어요. 공공 데이터 응답을 기다리는 중이에요" : step;

  return (
    <p
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[15px] font-bold ${
        tone === "dark" ? "bg-cream/10 text-cream" : "border-2 border-ink/15 bg-surface text-ink"
      }`}
    >
      <span aria-hidden className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loading-dot size-1.5 rounded-full bg-current"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </span>
      {text}
    </p>
  );
}
