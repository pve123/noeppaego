import type { BreakOptionView } from "@/contexts/calendar";

export function leaveText(option: BreakOptionView): string {
  return option.leaveCount === 0
    ? "연차 없이"
    : `연차 ${option.leaveCount}일 (${option.leaveLabels.join(", ")})`;
}
