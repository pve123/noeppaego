import type { BreakOptionView } from "@/contexts/calendar";
import { joinWithAnd, rangeText } from "@/shared/kernel/korean";

/** 「12.25(금)부터 12.27(일)까지」 */
export function periodText(option: BreakOptionView): string {
  return rangeText(option.startLabel, option.endLabel);
}

/** 「연차 없이 쉬어요」「2.19(목)과 2.20(금)에 연차를 내면 돼요」 */
export function leaveText(option: BreakOptionView): string {
  return option.leaveCount === 0 ? "연차 없이 쉬어요" : `${joinWithAnd(option.leaveLabels)}에 연차를 내면 돼요`;
}
