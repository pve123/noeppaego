import type { BreakOptionView } from "@/contexts/calendar";
import { joinWithAnd, rangeText } from "@/shared/kernel/korean";

/** `2026.01.02(금)` → `01.02(금)` — 같은 해 안에서는 연도를 한 번만 쓴다 */
const withoutYear = (label: string) => label.replace(/^\d{4}\./, "");

/** 「2026.12.25(금)부터 12.27(일)까지」 — 끝날이 같은 해면 연도를 뺀다(해를 넘기면 그대로) */
export function periodText(option: BreakOptionView): string {
  const sameYear = option.startIso.slice(0, 4) === option.endIso.slice(0, 4);
  return rangeText(option.startLabel, sameYear ? withoutYear(option.endLabel) : option.endLabel);
}

/**
 * 기간 줄 — 달력 아이콘과 굵은 글씨로 「언제」를 먼저 읽히게. 색은 놓인 바탕을 따른다(currentColor).
 * 연차 줄(LeaveLine)과 같은 높이·간격으로 위아래 짝을 맞춘다.
 */
export function PeriodLine({ option, className = "" }: { option: BreakOptionView; className?: string }) {
  return (
    <p className={`flex items-center gap-2 font-bold ${className}`}>
      <svg viewBox="0 0 24 24" aria-hidden className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </svg>
      {periodText(option)}
    </p>
  );
}

/**
 * 연차 줄 — 문장 대신 뱃지로 먼저 보여 준다: [연차 없이 쉬어요] 또는 [연차 1일] 01.02(금).
 * 뱃지 색은 날짜 띠(DayStrip)와 같다 — 연차는 노랑, 연차 없음은 민트.
 */
export function LeaveLine({ option, className = "" }: { option: BreakOptionView; className?: string }) {
  const badge = "shrink-0 rounded-full border-2 border-ink px-2.5 py-0.5 text-[13px] font-bold text-ink";
  if (option.leaveCount === 0) {
    return (
      <p className={`flex items-center ${className}`}>
        <span className={`${badge} bg-mint`}>연차 없이 쉬어요</span>
      </p>
    );
  }
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <span className={`${badge} bg-yellow`}>연차 {option.leaveCount}일</span>
      <span>{joinWithAnd(option.leaveLabels.map(withoutYear))}</span>
    </p>
  );
}
