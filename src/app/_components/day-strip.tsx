import type { DayKind, DayView } from "@/contexts/calendar";

/** 쉬는 날은 코랄 계열 — 공휴일은 진하게, 주말은 옅게. 연차는 노랑 */
const CELL: Record<DayKind, string> = {
  weekend: "bg-coral-soft",
  holiday: "bg-coral",
  leave: "bg-yellow",
};

const KIND_LABEL: Record<DayKind, string> = {
  weekend: "주말",
  holiday: "공휴일",
  leave: "연차",
};

const KINDS: DayKind[] = ["holiday", "weekend", "leave"];

/** 연휴 날짜를 한 칸씩 — 공휴일·주말·연차를 색으로 구분한다. */
export function DayStrip({
  days,
  size = "md",
  tone = "light",
}: {
  days: DayView[];
  size?: "sm" | "md";
  tone?: "light" | "dark";
}) {
  const cell = size === "md" ? "h-16 w-12 text-xl" : "h-12 w-9 text-base";
  const border = tone === "dark" ? "border-transparent" : "border-ink/10";
  return (
    <ol className={`mt-3 flex flex-wrap gap-1.5 ${tone === "dark" ? "justify-center" : ""}`}>
      {days.map((d) => (
        <li
          key={d.iso}
          title={d.holidayName ?? KIND_LABEL[d.kind]}
          className={`flex flex-col items-center justify-center rounded-xl border font-display leading-none text-ink ${cell} ${border} ${CELL[d.kind]}`}
        >
          <span className="mb-1 font-sans text-[11px] font-bold">{d.weekdayLabel}</span>
          {d.day}
          <span className="sr-only">일 {d.holidayName ?? KIND_LABEL[d.kind]}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * 색 설명 — 버튼으로 보이지 않게 색 점과 글자만.
 * days 를 주면 그 연휴에 있는 색만 보여 준다.
 */
export function DayLegend({ days, tone = "light" }: { days?: DayView[]; tone?: "light" | "dark" }) {
  const kinds = days ? KINDS.filter((kind) => days.some((d) => d.kind === kind)) : KINDS;
  return (
    <ul
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] font-bold ${tone === "dark" ? "justify-center text-cream/80" : "text-muted"}`}
      aria-label="색 설명"
    >
      {kinds.map((kind) => (
        <li key={kind} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={`size-3 rounded-[4px] ${CELL[kind]} ${tone === "light" ? "ring-1 ring-ink/10" : ""}`} />
          {KIND_LABEL[kind]}
        </li>
      ))}
    </ul>
  );
}
