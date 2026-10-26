import Link from "next/link";

export function YearTabs({ years, selected }: { years: number[]; selected: number }) {
  return (
    <nav aria-label="연도" className="mt-6 flex flex-wrap gap-2.5">
      {years.map((year) => {
        const active = year === selected;
        return (
          <Link
            key={year}
            href={`/?year=${year}#breaks`}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-12 items-center rounded-full border-[3px] border-ink px-5 font-display text-lg transition-transform ${
              active ? "-rotate-2 bg-yellow shadow-pop-sm" : "bg-surface hover:-translate-y-0.5"
            }`}
          >
            {year}년
          </Link>
        );
      })}
    </nav>
  );
}
