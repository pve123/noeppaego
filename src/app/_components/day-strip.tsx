import type { DayKind, DayView } from "@/contexts/calendar";

const CELL: Record<DayKind, string> = {
  weekend: "bg-surface",
  holiday: "bg-coral",
  leave: "bg-yellow",
};

const KIND_LABEL: Record<DayKind, string> = {
  weekend: "주말",
  holiday: "공휴일",
  leave: "연차",
};

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
  const border = tone === "dark" ? "border-cream" : "border-ink";
  return (
    <ol className={`mt-3 flex flex-wrap gap-1.5 ${tone === "dark" ? "justify-center" : ""}`}>
      {days.map((d) => (
        <li
          key={d.iso}
          title={d.holidayName ?? KIND_LABEL[d.kind]}
          className={`flex flex-col items-center justify-center rounded-xl border-[2.5px] font-display leading-none text-ink ${cell} ${border} ${CELL[d.kind]}`}
        >
          <span className="mb-1 font-sans text-[11px] font-bold">{d.weekdayLabel}</span>
          {d.day}
          <span className="sr-only">일 {d.holidayName ?? KIND_LABEL[d.kind]}</span>
        </li>
      ))}
    </ol>
  );
}

export function DayLegend() {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="색 설명">
      {(Object.keys(CELL) as DayKind[]).map((kind) => (
        <li
          key={kind}
          className={`rounded-full border-[2.5px] border-ink px-3 py-1 font-display text-[15px] ${CELL[kind]}`}
        >
          {KIND_LABEL[kind]}
        </li>
      ))}
    </ul>
  );
}
