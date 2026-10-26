import type { ReactNode } from "react";

const TONES = {
  info: { box: "bg-surface", icon: "bg-mint", mark: "i" },
  highlight: { box: "bg-yellow", icon: "bg-surface", mark: "!" },
} as const;

/** 한 줄 안내 — 아이콘·글·(있으면) 행동 버튼. 화면마다 같은 모양으로 */
export function Notice({ tone = "info", children, action }: { tone?: keyof typeof TONES; children: ReactNode; action?: ReactNode }) {
  const t = TONES[tone];
  return (
    <div role="status" className={`flex flex-wrap items-center gap-3 rounded-2xl border-[2.5px] border-ink px-4 py-3 ${t.box}`}>
      <span aria-hidden className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display ${t.icon}`}>
        {t.mark}
      </span>
      <p className="min-w-0 flex-1 text-[15px] font-bold">{children}</p>
      {action}
    </div>
  );
}
