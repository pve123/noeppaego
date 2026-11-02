import Link from "next/link";

const LABELS = ["날짜", "갈 곳", "일정"] as const;

/**
 * 지금 몇 번째 단계인지 — 날짜 → 갈 곳 → 일정. 지난 단계는 눌러서 돌아간다.
 * @param hrefs 지난 단계로 가는 주소(1단계, 2단계 순)
 */
export function Steps({ current, hrefs = [] }: { current: 1 | 2 | 3; hrefs?: string[] }) {
  return (
    <nav aria-label="진행 단계" className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
      <ol className="flex items-center gap-2 text-[15px]">
        {LABELS.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const here = step === current;
          const badge = (
            <span
              className={`flex size-7 items-center justify-center rounded-full border border-ink/15 font-display text-sm ${
                here ? "bg-yellow" : done ? "bg-mint" : "bg-surface text-muted"
              }`}
            >
              {step}
            </span>
          );
          const body = (
            <>
              {badge}
              <span className={here ? "font-bold" : "text-muted"}>{label}</span>
            </>
          );
          return (
            <li key={label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="h-[2.5px] w-4 rounded bg-ink/30 sm:w-8" />}
              {done && hrefs[i] ? (
                <Link href={hrefs[i]} className="flex items-center gap-1.5 hover:underline">
                  {body}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5" aria-current={here ? "step" : undefined}>
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
