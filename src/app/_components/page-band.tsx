import type { ReactNode } from "react";

/**
 * 상세 페이지 머리 — 첫 화면의 큰 띠보다 작게, 지금 무엇을 보는지만.
 * aside 는 넓은 화면(lg)에서만 오른쪽에 — 글이 왼쪽에만 몰려 오른쪽이 비지 않게.
 */
export function PageBand({
  eyebrow,
  title,
  sub,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  sub?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="mt-4 bg-band text-cream">
      <div className="mx-auto flex max-w-6xl items-center gap-10 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {eyebrow && <p className="font-display text-[17px] text-yellow">{eyebrow}</p>}
          <h1 className="font-display text-[clamp(30px,4.5vw,48px)] leading-tight text-balance">{title}</h1>
          {/* div — 부제 안에 줄(p)을 여러 개 넣는 곳이 있다(p 안에 p 는 HTML 오류) */}
          {sub && <div className="text-[16px] text-soft-ink text-balance">{sub}</div>}
          {children}
        </div>
        {aside && <div className="hidden shrink-0 lg:block">{aside}</div>}
      </div>
    </section>
  );
}
