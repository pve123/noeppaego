import type { LongBreakView } from "@/contexts/calendar";
import { BreakCard } from "./break-card";
import { DayLegend } from "./day-strip";

export function BreakList({ breaks }: { breaks: LongBreakView[] }) {
  const past = breaks.filter((b) => b.status.kind === "past");
  const coming = breaks.filter((b) => b.status.kind !== "past");

  return (
    <div className="mt-10">
      <DayLegend />

      {coming.length === 0 ? (
        <p className="mt-6 rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center font-display text-[22px]">
          올해 남은 연휴가 없어요. 내년 탭을 눌러 볼까요?
        </p>
      ) : (
        <MonthGroups breaks={coming} />
      )}

      {past.length > 0 && (
        <details className="group mt-12">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-display text-lg underline underline-offset-4">
            지난 연휴 {past.length}개 보기
            <span className="transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="opacity-60">
            <MonthGroups breaks={past} />
          </div>
        </details>
      )}
    </div>
  );
}

function MonthGroups({ breaks }: { breaks: LongBreakView[] }) {
  const byMonth = Map.groupBy(breaks, (b) => b.month);
  return (
    <div className="mt-8 space-y-10">
      {[...byMonth].map(([month, items]) => (
        <div key={month}>
          <h3 className="mb-4 font-display text-[28px]">{month}월</h3>
          <ul className="grid gap-6 md:grid-cols-2">
            {items.map((item, i) => (
              <li key={item.key} className="min-w-0">
                <BreakCard item={item} colorIndex={month + i} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
