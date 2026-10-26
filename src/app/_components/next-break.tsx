import type { LongBreakView } from "@/contexts/calendar";
import { DayStrip } from "./day-strip";
import { leaveText } from "./leave-text";

/** 가장 가까운 연휴 — 첫 화면 바로 아래 잉크색 띠로 크게 보여 준다. */
export function NextBreak({ item }: { item: LongBreakView }) {
  const { base, status } = item;
  return (
    <section id="next" aria-labelledby="next-title" className="scroll-mt-4 bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-18 text-center sm:px-6">
        <span className="rotate-2 rounded-full border-[3px] border-cream bg-yellow px-4 py-1.5 font-display text-lg text-ink">
          {status.kind === "ongoing" ? "지금 연휴 중!" : `다음 연휴까지 D-${status.kind === "upcoming" ? status.daysLeft : 0}`}
        </span>
        <h2 id="next-title" className="font-display text-[clamp(32px,4vw,48px)] leading-tight">
          {item.title}
        </h2>
        <p className="text-[17px] text-soft-ink">
          {base.startLabel} – {base.endLabel} · {leaveText(base)}
        </p>
        <p className="font-display text-[clamp(56px,8vw,96px)] leading-none text-yellow">{base.length}일</p>
        <DayStrip days={base.days} tone="dark" />
      </div>
    </section>
  );
}
