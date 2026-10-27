import type { LongBreakView } from "@/contexts/calendar";
import { BreakCard } from "./break-card";
import { DayLegend } from "./day-strip";

export function BreakList({ breaks, nextYear }: { breaks: LongBreakView[]; nextYear: number }) {
  const past = breaks.filter((b) => b.status.kind === "past");
  const coming = breaks.filter((b) => b.status.kind !== "past");

  return (
    <div className="mt-8">
      <DayLegend />

      {coming.length === 0 ? (
        <p className="mt-6 rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center font-display text-[22px]">
          올해 남은 연휴가 없어요. {nextYear}년을 눌러 보세요.
        </p>
      ) : (
        <MonthGroups breaks={coming} />
      )}

      {past.length > 0 && (
        <details className="group mt-12">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-display text-lg underline underline-offset-4">
            지난 연휴 {past.length}개
            <span className="transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <p className="mt-3 text-sm text-muted">지난 연휴도 눌러서 그때 갈 만했던 곳과 일정을 볼 수 있어요.</p>
          <div className="opacity-75 transition-opacity hover:opacity-100">
            <MonthGroups breaks={past} />
          </div>
        </details>
      )}
    </div>
  );
}

/** 한 판으로 이어 놓는다 — 달마다 묶으면 연휴가 하나뿐인 달은 카드 하나만 덩그러니 남는다. 몇 월인지는 카드에 */
function MonthGroups({ breaks }: { breaks: LongBreakView[] }) {
  return (
    <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {breaks.map((item) => (
        <li key={item.key} className="min-w-0">
          <BreakCard item={item} />
        </li>
      ))}
    </ul>
  );
}
