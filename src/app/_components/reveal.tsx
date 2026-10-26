import { Suspense, ViewTransition, type ReactNode } from "react";

/**
 * 불러오는 동안 보여 줄 자리(fallback)와 내용 사이를 부드럽게 바꾸는 Suspense.
 * 자리는 빠르게 내려가며 사라지고 내용은 조금 늦게 올라오며 나타난다(브라우저가 못 하면 그냥 바뀐다).
 */
export function RevealSuspense({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <ViewTransition exit="slide-down" default="none">
          {fallback}
        </ViewTransition>
      }
    >
      <ViewTransition enter="slide-up" default="none">
        {children}
      </ViewTransition>
    </Suspense>
  );
}

/** 빛이 지나가는 회색 자리 */
export function Shimmer({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`shimmer rounded-3xl ${className}`} />;
}
