import type { LongBreakView } from "@/contexts/calendar";
import { DayStrip } from "./day-strip";
import { leaveText } from "./leave-text";
import { WhereToLink } from "./where-to-link";

/**
 * 연휴 하나를 잉크색 띠로 크게 — 첫 화면의 「다음 연휴」와 연휴 상세 페이지 머리에 쓴다.
 * @param withLink 「어디 갈까?」 버튼 — 상세 페이지에서는 이미 그 화면이라 끈다.
 */
export function NextBreak({
  item,
  withLink = true,
  upcomingLabel = "다음 연휴까지",
}: {
  item: LongBreakView;
  withLink?: boolean;
  /** D-day 앞 문구 — 내년 탭에서는 「2027년 첫 연휴까지」 */
  upcomingLabel?: string;
}) {
  const { base, status } = item;
  return (
    <section id="next" aria-labelledby="next-title" className="scroll-mt-4 bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-18 text-center sm:px-6">
        <span className="rotate-2 rounded-full border-[3px] border-cream bg-yellow px-4 py-1.5 font-display text-lg text-ink">
          {status.kind === "ongoing" && "지금 연휴 중!"}
          {status.kind === "upcoming" && `${upcomingLabel} D-${status.daysLeft}`}
          {status.kind === "past" && "지난 연휴"}
        </span>
        <h2 id="next-title" className="font-display text-[clamp(32px,4vw,48px)] leading-tight">
          {item.title}
        </h2>
        <p className="text-[17px] text-soft-ink">
          {base.startLabel} – {base.endLabel} · {leaveText(base)}
        </p>
        <p className="font-display text-[clamp(56px,8vw,96px)] leading-none text-yellow">{base.length}일</p>
        <DayStrip days={base.days} tone="dark" />
        {withLink && <WhereToLink item={item} tone="dark" />}
      </div>
    </section>
  );
}
