import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CalendarDate, findLongBreak, type LongBreakView } from "@/contexts/calendar";
import { describeItinerary, planItinerary, type ItineraryView } from "@/contexts/itinerary";
import { rangeText } from "@/shared/kernel/korean";
import { PublicDataError } from "@/shared/public-data/public-data";
import { DAY_TONES, DaySummary, DaySummarySkeleton, ItineraryDay } from "../../../_components/itinerary-day";
import { ItineraryMap, type MapDay } from "../../../_components/itinerary-map";
import { PageBand } from "../../../_components/page-band";
import { SiteFooter, SiteHeader } from "../../../_components/site-header";
import { SourceError } from "../../../_components/source-error";
import { Steps } from "../../../_components/steps";

export const metadata: Metadata = {
  title: "여행 일정 | 연휴 여행 플래너",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REGION_CODE = /^\d+(-\d+)?$/;

export default function ItineraryPage({ params }: PageProps<"/breaks/[start]/[region]">) {
  return (
    <>
      <SiteHeader />
      <main>
        <Suspense fallback={<ItinerarySkeleton />}>
          <Itinerary params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Itinerary({ params }: Pick<PageProps<"/breaks/[start]/[region]">, "params">) {
  const { start, region } = await params;
  if (!ISO_DATE.test(start) || !REGION_CODE.test(region)) notFound();
  await connection(); // 「오늘」은 요청 시각 기준
  const today = CalendarDate.todayIn("Asia/Seoul", new Date());

  let longBreak: LongBreakView | undefined;
  let plan: ItineraryView | undefined;
  try {
    longBreak = await findLongBreak({ start: CalendarDate.of(start), today });
    if (!longBreak) notFound();
    plan = await planItinerary({
      start: longBreak.base.startIso,
      end: longBreak.base.endIso,
      regionCode: region,
      today: today.iso,
    });
  } catch (e) {
    if (e instanceof PublicDataError) return <SourceError subject="여행 정보" failure={e.failure} code={e.code} />;
    throw e;
  }
  if (!plan) notFound();

  // 소개 글은 기다리지 않는다 — 날마다 Suspense 로 늦게 채운다(호출은 한 번).
  const summaries = describeItinerary(plan);
  const noWeather = plan.days.every((d) => !d.weather);

  const mapDays: MapDay[] = plan.days.map((day) => ({
    dayNumber: day.dayNumber,
    dateLabel: day.dateLabel,
    tone: DAY_TONES[(day.dayNumber - 1) % DAY_TONES.length],
    stops: day.slots.flatMap((slot) =>
      slot.place
        ? [{ id: `${slot.key}-${slot.place.id}`, lat: slot.place.lat, lng: slot.place.lng, title: slot.place.title, timeLabel: slot.timeLabel }]
        : [],
    ),
  }));

  return (
    <>
      <Steps current={3} hrefs={["/#breaks", `/breaks/${start}`]} />
      <PageBand
        eyebrow={`${longBreak.title} 연휴`}
        title={`${plan.regionName} ${plan.lengthLabel}`}
        sub={
          <>
            {rangeText(plan.startLabel, plan.endLabel)} 일정이에요.
            <br />
            가까운 곳끼리 이어서 짰어요.
          </>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {noWeather && <p className="mb-8 rounded-2xl bg-surface px-4 py-3 text-[15px]">날씨는 출발 10일 전부터 일정에 반영해요.</p>}

        <div className="space-y-12">
          {plan.days.map((day, i) => (
            <ItineraryDay
              key={day.dayNumber}
              day={day}
              summary={
                <Suspense fallback={<DaySummarySkeleton />}>
                  <DaySummary summaries={summaries} index={i} />
                </Suspense>
              }
            />
          ))}
        </div>

        <div className="mt-14">
          <ItineraryMap days={mapDays} regionName={plan.regionName} />
        </div>
      </div>
    </>
  );
}

function ItinerarySkeleton() {
  return (
    <div aria-busy="true" aria-label="일정을 짜는 중">
      <div className="mt-4 h-40 animate-pulse bg-ink/90" />
      <div className="mx-auto max-w-6xl animate-pulse space-y-3 px-4 py-10 sm:px-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-soft-ink" />
        ))}
      </div>
    </div>
  );
}
