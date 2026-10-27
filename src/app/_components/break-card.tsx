import Link from "next/link";
import type { BreakStatus, LongBreakView } from "@/contexts/calendar";
import { DayStrip } from "./day-strip";
import { leaveText, periodText } from "./leave-text";

/**
 * 연휴 카드 — 카드 전체가 「갈 곳 보기」 링크다. 할 일은 하나만 둔다.
 * 연차로 늘리는 방법은 가장 긴 것 한 줄만 보여 준다. 지난 연휴도 그때 갈 만했던 곳을 볼 수 있다.
 */
export function BreakCard({ item }: { item: LongBreakView }) {
  const { base } = item;
  const longest = item.extensions.at(-1);

  return (
    <Link href={`/breaks/${item.key}`} className="group block h-full rounded-3xl outline-offset-4">
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border-[3px] border-ink bg-surface shadow-pop transition-transform group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink bg-mint px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink/70">{item.month}월</p>
            <h4 className="font-display text-[22px] leading-tight">{item.title}</h4>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-5 pb-5 pt-4">
          <p className="font-display text-[44px] leading-none">{base.length}일</p>
          <p className="text-[15px] text-muted">
            {periodText(base)}
            <br />
            {leaveText(base)}
          </p>
          <DayStrip days={base.days} size="sm" />
          {longest && (
            <p className="mt-2 text-[15px]">
              연차 {longest.leaveCount}일을 더 쓰면 <strong className="font-display text-lg">{longest.length}일</strong> 쉬어요
            </p>
          )}
          <p className="mt-auto pt-3 text-right font-display text-lg">
            갈 곳 보기 <span aria-hidden>→</span>
          </p>
        </div>
      </article>
    </Link>
  );
}

function StatusBadge({ status }: { status: BreakStatus }) {
  const sticker = "shrink-0 rounded-full border-[2.5px] border-ink px-3 py-0.5 font-display text-[15px]";
  if (status.kind === "past") return <span className={`${sticker} bg-surface`}>지남</span>;
  if (status.kind === "ongoing") return <span className={`${sticker} rotate-3 bg-coral`}>연휴 중</span>;
  return <span className={`${sticker} rotate-3 bg-surface tabular-nums`}>D-{status.daysLeft}</span>;
}
