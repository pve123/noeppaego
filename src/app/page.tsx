import { Suspense } from "react";
import { connection } from "next/server";
import { CalendarDate, findLongBreaks } from "@/contexts/calendar";
import { PublicDataError } from "@/shared/public-data/public-data";
import { BreakList } from "./_components/break-list";
import { BreaksSkeleton } from "./_components/breaks-skeleton";
import { Hero } from "./_components/hero";
import { NextBreak } from "./_components/next-break";
import { SiteFooter, SiteHeader } from "./_components/site-header";
import { SourceError } from "./_components/source-error";
import { YearTabs } from "./_components/year-tabs";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Suspense fallback={<BreaksSkeleton />}>
          <Breaks searchParams={searchParams} />
        </Suspense>
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
      {view.next && <NextBreak item={view.next} />}

      <section id="breaks" aria-labelledby="all-breaks" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-3">
          <h2 id="all-breaks" className="font-display text-[clamp(32px,4vw,48px)] leading-tight">
            {view.year}년 연휴 한눈에 보기
          </h2>
          {!view.notPublished && (
            <p className="text-[17px]">
              공휴일 {view.holidayCount}일 · 연차 없이 3일 이상 쉬는 연휴{" "}
              <mark className="rounded-md bg-yellow px-1.5 font-bold text-ink">{view.freeBreakCount}번</mark>
            </p>
          )}
        </div>
        <YearTabs years={view.years} selected={view.year} />

        {view.notPublished ? (
          <p className="mt-8 rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center font-display text-[22px]">
            {view.year}년 공휴일은 아직 발표 전이에요. 보통 그 전 해 여름쯤 나와요!
          </p>
        ) : (
          <BreakList breaks={view.breaks} />
        )}
      </section>
    </>
  );
}
