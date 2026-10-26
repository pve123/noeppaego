import Link from "next/link";
import type { LongBreakView } from "@/contexts/calendar";

/** 연휴 → 갈 만한 곳 페이지. 지난 연휴에는 달지 않는다. */
export function WhereToLink({ item, tone = "light" }: { item: LongBreakView; tone?: "light" | "dark" }) {
  if (item.status.kind === "past") return null;
  const tones = tone === "dark" ? "self-center border-cream bg-coral" : "self-start border-ink bg-mint";
  return (
    <Link
      href={`/breaks/${item.key}`}
      className={`inline-flex h-12 items-center gap-2 rounded-2xl border-[3px] px-5 font-display text-lg text-ink transition-transform hover:-translate-y-0.5 ${tones}`}
    >
      어디 갈까?
      <span aria-hidden>→</span>
    </Link>
  );
}
