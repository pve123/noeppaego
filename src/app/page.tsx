import { connection } from "next/server";
import { CalendarDate, findLongBreaks } from "@/contexts/calendar";
import { PublicDataError } from "@/shared/public-data/public-data";
import { BreakList } from "./_components/break-list";
import { BreaksSkeleton } from "./_components/skeletons";
import { Hero } from "./_components/hero";
import { RevealSuspense } from "./_components/reveal";
import { NextBreak } from "./_components/next-break";
import { SiteFooter, SiteHeader, SiteNotice } from "./_components/site-header";
import { SourceError } from "./_components/source-error";
import { YearTabs } from "./_components/year-tabs";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <SiteHeader />
      <SiteNotice />
      <main>
        <Hero />
        <RevealSuspense fallback={<BreaksSkeleton />}>
          <Breaks searchParams={searchParams} />
        </RevealSuspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Breaks({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { year } = await searchParams;
  await connection(); // 「오늘」은 요청 시각 기준
  const today = CalendarDate.todayIn("Asia/Seoul", new Date());

  let view;
  try {
    view = await findLongBreaks({ year: Number(year) || undefined, today });
  } catch (e) {
    if (e instanceof PublicDataError) return <SourceError subject="공휴일 정보" failure={e.failure} code={e.code} />;
    throw e;
  }

  return (
    <>
      {view.next && (
        <NextBreak
          item={view.next}
          upcomingLabel={view.year === today.year ? "다음 연휴까지" : `${view.year}년 첫 연휴까지`}
        />
      )}

      <section id="breaks" aria-labelledby="all-breaks" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="all-breaks" className="font-display text-[clamp(30px,4vw,44px)] leading-tight">
            {view.year}년 연휴
          </h2>
          <YearTabs years={view.years} selected={view.year} />
        </div>
        {!view.notPublished && (
          <ul className="mt-4 flex flex-wrap gap-2 text-[15px]">
            {/* 날짜 칸·연차 줄과 같은 색 — 공휴일은 코랄, 연차 없이는 민트 */}
            <li className="rounded-full bg-coral px-3 py-1 font-bold">공휴일 {view.holidayCount}일</li>
            <li className="rounded-full bg-mint px-3 py-1 font-bold">연차 없이 3일 이상 쉬는 연휴 {view.freeBreakCount}번</li>
          </ul>
        )}

        {view.notPublished ? (
          <p className="mt-8 rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center font-display text-[22px]">
            {view.year}년 공휴일은 아직 발표되지 않았어요. 보통 전년도 여름에 나와요.
          </p>
        ) : (
          <BreakList breaks={view.breaks} nextYear={view.years.at(-1)!} />
        )}
      </section>
    </>
  );
}
