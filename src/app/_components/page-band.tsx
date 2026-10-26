import type { ReactNode } from "react";

/** 상세 페이지 머리 — 첫 화면의 큰 띠보다 작게, 지금 무엇을 보는지만 */
export function PageBand({ eyebrow, title, sub, children }: { eyebrow?: string; title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <section className="mt-4 bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:px-6 sm:py-10">
        {eyebrow && <p className="font-display text-[17px] text-yellow">{eyebrow}</p>}
        <h1 className="font-display text-[clamp(30px,4.5vw,48px)] leading-tight text-balance">{title}</h1>
        {sub && <p className="text-[16px] text-soft-ink">{sub}</p>}
        {children}
      </div>
    </section>
  );
}
