import Link from "next/link";
import type { LeavePlanView } from "@/contexts/calendar";
import { DayStrip } from "./day-strip";
import { periodText } from "./leave-text";

/** 처음 고르는 남은 연차 — 많이들 남기는 수 */
const QUICK = [3, 5, 10, 15];
/** 고를 수 있는 남은 연차 — 한 해 연차(최대 25일)를 넉넉히 */
const MAX_LEAVE = 30;

/** 남은 연차 주소 값 → 0~MAX_LEAVE. 없거나 숫자가 아니면 undefined */
export function leaveOf(value: string | string[] | undefined): number | undefined {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return value !== undefined && Number.isInteger(n) && n >= 0 ? Math.min(n, MAX_LEAVE) : undefined;
}

const hrefOf = (year: number, leave: number) => `/?year=${year}&leave=${leave}#leave-plan`;

/**
 * 「남은 연차로 가장 길게 쉬기」 — 남은 연차를 고르면 앞으로 올 연휴에 어떻게 나눠 쓸지 보여 준다.
 * 연차 수는 주소(?leave=)로 받는다 — 링크라 자바스크립트 없이도 된다.
 */
export function LeavePlan({ year, plan }: { year: number; plan?: LeavePlanView }) {
  return (
    <section id="leave-plan" aria-labelledby="leave-plan-title" className="mt-8 scroll-mt-20 rounded-3xl border border-ink/10 bg-surface p-5 shadow-pop sm:p-6">
      <h3 id="leave-plan-title" className="font-display text-[22px] leading-tight">
        남은 연차로 가장 길게 쉬기
      </h3>

      {!plan ? (
        <>
          <p className="mt-1 text-[15px] text-muted">남은 연차를 고르면 {year}년 연휴에 어떻게 나눠 쓸지 짜 드려요.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {QUICK.map((n) => (
              <li key={n}>
                <Link
                  href={hrefOf(year, n)}
                  scroll={false}
                  className="inline-flex h-11 items-center rounded-full border border-ink/15 bg-surface px-4 font-display text-[16px] hover:bg-yellow"
                >
                  연차 {n}개
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <Stepper year={year} leave={plan.leave} />
            <p className="min-w-0 text-[15px] text-muted">남은 연차</p>
          </div>

          {plan.picks.length === 0 ? (
            <p className="mt-4 text-[15px]">앞으로 남은 연휴가 없어요. 다음 해 연휴를 골라 보세요.</p>
          ) : (
            <>
              <p className="mt-4 font-display text-[20px] leading-snug">
                <span className="block">
                  연차 {plan.used}개로 연휴 <span className="rounded-lg bg-yellow px-1.5">{plan.totalDays}일</span> 쉬어요.
                </span>
                {plan.leave > plan.used && (
                  <span className="block text-[15px] font-bold text-muted">연차 {plan.leave - plan.used}개는 다른 날에 쓰세요.</span>
                )}
              </p>
              {/* 알고 싶은 건 「어디에 연차를 쓰나」 — 연차 쓰는 연휴만 카드로, 연차 없이 쉬는 연휴는 한 줄로 */}
              <ol className="mt-4 space-y-3">
                {plan.picks.filter((pick) => pick.option.leaveCount > 0).map((pick) => (
                  <li key={pick.key}>
                    <Link
                      href={`/breaks/${pick.key}`}
                      className="block rounded-2xl border border-ink/10 px-4 py-3 transition-colors hover:bg-cream"
                    >
                      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-display text-[18px]">{pick.title}</span>
                        <span className="flex gap-2 text-[14px] font-bold">
                          <span>{pick.option.length}일</span>
                          {pick.option.leaveCount > 0 && <span className="text-muted">연차 {pick.option.leaveCount}개</span>}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[13px] text-muted">{periodText(pick.option)}</p>
                      <DayStrip days={pick.option.days} size="sm" />
                    </Link>
                  </li>
                ))}
              </ol>
              <FreeBreaks picks={plan.picks.filter((pick) => pick.option.leaveCount === 0)} />
            </>
          )}
        </>
      )}
    </section>
  );
}

/** 연차 없이 쉬는 연휴 — 이름만 한 줄로 */
function FreeBreaks({ picks }: { picks: LeavePlanView["picks"] }) {
  if (picks.length === 0) return null;
  // 이웃한 연휴가 날짜를 나눠 가질 수 있어 날짜로 세어 한 번만 센다
  const days = new Set(picks.flatMap((p) => p.option.days.map((d) => d.iso))).size;
  return (
    <div className="mt-4 rounded-2xl bg-mint/15 px-4 py-3 text-[14px]">
      <p className="font-bold">연차 없이 쉬는 연휴 {picks.length}번에서 {days}일을 쉬어요.</p>
      <ul aria-label="연차 없이 쉬는 연휴" className="mt-2 flex flex-wrap gap-1.5">
        {picks.map((p) => (
          <li key={p.key} className="rounded-full bg-surface px-2.5 py-0.5 text-[13px] font-bold text-ink/80">
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** − n + — 하나씩 줄이고 늘린다 */
function Stepper({ year, leave }: { year: number; leave: number }) {
  const button = "flex size-11 items-center justify-center font-display text-[22px] leading-none hover:bg-yellow";
  const off = "pointer-events-none opacity-30";
  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-ink/15 bg-surface">
      <Link href={hrefOf(year, Math.max(0, leave - 1))} scroll={false} aria-label="연차 하나 줄이기" aria-disabled={leave === 0} className={`${button} ${leave === 0 ? off : ""}`}>
        −
      </Link>
      <span aria-live="polite" className="min-w-16 text-center font-display text-[18px] tabular-nums">
        {leave}개
      </span>
      <Link
        href={hrefOf(year, Math.min(MAX_LEAVE, leave + 1))}
        scroll={false}
        aria-label="연차 하나 늘리기"
        aria-disabled={leave === MAX_LEAVE}
        className={`${button} ${leave === MAX_LEAVE ? off : ""}`}
      >
        +
      </Link>
    </div>
  );
}
