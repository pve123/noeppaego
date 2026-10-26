import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CalendarDate, findLongBreak, type LongBreakView } from "@/contexts/calendar";
import { describeItinerary, planItinerary, type ItineraryView } from "@/contexts/itinerary";
import { PublicDataError } from "@/shared/public-data/public-data";
import { DAY_TONES, DaySummary, DaySummarySkeleton, ItineraryDay } from "../../../_components/itinerary-day";
import { KakaoMap, type MapPin } from "../../../_components/kakao-map";
import { SiteFooter, SiteHeader } from "../../../_components/site-header";
import { SourceError } from "../../../_components/source-error";

export const metadata: Metadata = {
  title: "여행 일정 · 연휴 여행 플래너",
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
    plan = await planItinerary({ start: longBreak.base.startIso, end: longBreak.base.endIso, regionCode: region });
  } catch (e) {
    if (e instanceof PublicDataError) return <SourceError subject="여행 정보" failure={e.failure} code={e.code} />;
    throw e;
  }
  if (!plan) notFound();

  // 소개 글은 기다리지 않는다 — 날마다 Suspense 로 늦게 채운다(호출은 한 번).
  const summaries = describeItinerary(plan);

  const pins: MapPin[] = plan.days.flatMap((day) =>
    day.slots.flatMap((slot, i) =>
      slot.place
        ? [
            {
              id: `${slot.key}-${slot.place.id}`,
              lat: slot.place.lat,
              lng: slot.place.lng,
              badge: `${day.dayNumber}-${i + 1}`,
              label: slot.place.title,
              tone: DAY_TONES[(day.dayNumber - 1) % DAY_TONES.length],
            },
          ]
        : [],
    ),
  );
  const routes = plan.days.map((day) => ({
    tone: DAY_TONES[(day.dayNumber - 1) % DAY_TONES.length],
    points: day.slots.flatMap((s) => (s.place ? [{ lat: s.place.lat, lng: s.place.lng }] : [])),
  }));

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <Link href={`/breaks/${start}`} className="font-display text-lg underline underline-offset-4">
          ← 추천 지역
        </Link>
      </div>

      <section aria-labelledby="plan-title" className="bg-ink text-cream">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <span className="rotate-2 rounded-full border-[3px] border-cream bg-yellow px-4 py-1.5 font-display text-lg text-ink">
            {longBreak.title} 연휴
          </span>
          <h1 id="plan-title" className="font-display text-[clamp(36px,5vw,60px)] leading-tight">
            {plan.regionName} {plan.lengthLabel}
          </h1>
          <p className="text-[17px] text-soft-ink">
            {plan.startLabel} – {plan.endLabel} · 가까운 곳끼리 이어 동선을 줄였어요
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <KakaoMap
          label={`${plan.regionName} 일정 지도, 하루별 동선`}
          pins={pins}
          routes={routes}
          caption="지도의 번호는 「일차-순서」예요. 동선은 직선으로 이은 것이라 실제 길과 다를 수 있어요."
        />

        <div className="mt-12 space-y-14">
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
      </div>
    </>
  );
}

function ItinerarySkeleton() {
  return (
    <div aria-busy="true" aria-label="일정을 짜는 중">
      <div className="h-64 animate-pulse bg-ink/90" />
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-14 sm:px-6">
        <div className="h-[360px] rounded-3xl bg-soft-ink" />
        <div className="mt-12 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-soft-ink" />
          ))}
        </div>
      </div>
    </div>
  );
}
