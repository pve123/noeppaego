import Link from "next/link";

/** 연도 고르기 — 둘 중 하나를 고르는 붙은 탭(세그먼트). 고른 해만 노랑 바탕 */
export function YearTabs({ years, selected }: { years: number[]; selected: number }) {
  return (
    <nav aria-label="연도" className="inline-flex rounded-full bg-ink/5 p-1">
      {years.map((year) => {
        const active = year === selected;
        return (
          <Link
            key={year}
            href={`/?year=${year}#breaks`}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-10 items-center rounded-full px-5 font-display text-[17px] transition-colors ${
              active ? "bg-yellow shadow-pop-sm" : "text-muted hover:text-ink"
            }`}
          >
            {year}년
          </Link>
        );
      })}
    </nav>
  );
}
