import Link from "next/link";
import type { LongBreakView } from "@/contexts/calendar";
import { DayStrip } from "./day-strip";
import { periodText } from "./leave-text";

/**
 * 첫 화면의 가장 가까운 연휴 — 할 일은 「갈 곳 찾기」 하나.
 * 강조는 날수(노랑)와 버튼 둘만 — 남은 날·기간·연차는 뱃지 없이 글자로, 날짜는 칸(DayStrip)이 보여 준다.
 */
export function NextBreak({ item, upcomingLabel = "다음 연휴까지" }: { item: LongBreakView; upcomingLabel?: string }) {
  const { base, status } = item;
  return (
    <section id="next" aria-labelledby="next-title" className="scroll-mt-4 bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6">
        <p className="font-bold text-yellow">
          {status.kind === "ongoing" && "지금 연휴 중이에요"}
          {status.kind === "upcoming" && `${upcomingLabel} D-${status.daysLeft}`}
          {status.kind === "past" && "지난 연휴"}
        </p>
        <h2 id="next-title" className="font-display text-[clamp(32px,4vw,48px)] leading-tight">
          {item.title}
        </h2>
        <p className="font-brand text-[clamp(56px,8vw,88px)] leading-none text-yellow">{base.length}일</p>
        {/* 기간과 연차를 한 줄씩 — 「연차 / 없이」처럼 말 가운데서 끊기지 않게 */}
        <p className="text-[17px] text-cream/80">
          <span className="block">{periodText(base)}</span>
          <span className="block">{base.leaveCount === 0 ? "연차 없이 쉬어요." : `연차 ${base.leaveCount}일만 쓰고 쉬어요.`}</span>
        </p>
        <DayStrip days={base.days} tone="dark" />
        {status.kind !== "past" && (
          <Link
            href={`/breaks/${item.key}`}
            className="mt-2 inline-flex h-14 items-center gap-2 rounded-[18px] bg-coral shadow-pop px-7 font-display text-xl text-ink transition-transform hover:-translate-y-0.5"
          >
            갈 곳 찾기
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </section>
  );
}
