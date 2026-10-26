import type { BreakStatus, LongBreakView } from "@/contexts/calendar";
import { DayStrip } from "./day-strip";
import { leaveText } from "./leave-text";

const BANDS = ["bg-yellow", "bg-mint", "bg-coral", "bg-lavender"];

export function BreakCard({ item, colorIndex }: { item: LongBreakView; colorIndex: number }) {
  const { base, extensions } = item;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border-[3px] border-ink bg-surface shadow-pop">
      <div className={`flex items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-4 ${BANDS[colorIndex % BANDS.length]}`}>
        <h4 className="min-w-0 font-display text-2xl leading-tight">{item.title}</h4>
        <StatusBadge status={item.status} />
      </div>

      <div className="flex flex-1 flex-col gap-2 px-5 pb-6 pt-4">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-display text-5xl leading-none">{base.length}일</span>
          <span className="text-[15px] font-medium text-muted">
            {base.startLabel} – {base.endLabel}
          </span>
        </p>
        <p className="text-[15px] font-bold">{leaveText(base)}</p>
        <DayStrip days={base.days} />

        {extensions.length > 0 && (
          <div className="mt-4 rounded-2xl border-[2.5px] border-dashed border-ink bg-cream p-4">
            <p className="font-display text-lg">연차를 더 쓰면 이만큼!</p>
            <ul className="mt-2 space-y-4">
              {extensions.map((o) => (
                <li key={o.days[0].iso + o.length}>
                  <p className="text-[15px]">
                    <span className="font-display text-2xl">{o.length}일</span>
                    <span className="text-muted">
                      {" "}
                      · {o.startLabel} – {o.endLabel} · {leaveText(o)}
                    </span>
                  </p>
                  <DayStrip days={o.days} size="sm" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: BreakStatus }) {
  const sticker = "shrink-0 rounded-full border-[2.5px] border-ink px-3 py-1 font-display text-[15px]";
  if (status.kind === "past") return <span className={`${sticker} bg-surface`}>지남</span>;
  if (status.kind === "ongoing") return <span className={`${sticker} rotate-3 bg-coral`}>연휴 중!</span>;
  return <span className={`${sticker} rotate-3 bg-surface tabular-nums`}>D-{status.daysLeft}</span>;
}
