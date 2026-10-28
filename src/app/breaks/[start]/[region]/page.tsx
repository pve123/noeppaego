import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CalendarDate, findLongBreak, type LongBreakView } from "@/contexts/calendar";
import { describeItinerary, planItinerary, type ItineraryView } from "@/contexts/itinerary";
import { rangeText } from "@/shared/kernel/korean";
import { PublicDataError } from "@/shared/public-data/public-data";
import { currentUser } from "@/shared/auth/session";
import { SaveBar, SaveCard } from "../../../_components/save-cta";
import { DAY_TONES, DaySummary, DaySummarySkeleton, ItineraryDay } from "../../../_components/itinerary-day";
import { ItineraryMap, type MapDay } from "../../../_components/itinerary-map";
import { Notice } from "../../../_components/notice";
import { PageBand } from "../../../_components/page-band";
import { RevealSuspense } from "../../../_components/reveal";
import { ItinerarySkeleton } from "../../../_components/skeletons";
import { SiteFooter, SiteHeader, SiteNotice } from "../../../_components/site-header";
import { SourceError } from "../../../_components/source-error";
import { Steps } from "../../../_components/steps";

export const metadata: Metadata = {
  title: "여행 일정 | 계획은 J가",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REGION_CODE = /^\d+(-\d+)?$/;

/** 바꾼 칸 `2026-12-25-lunch~kakao:123` — 칸 키와 장소 id */
const PICK = /^(\d{4}-\d{2}-\d{2}-(?:morning|lunch|cafe|afternoon|dinner|night))~([\w:.-]{1,80})$/;

function parsePicks(raw: string | string[] | undefined): Record<string, string> {
  const picks: Record<string, string> = {};
  for (const value of [raw ?? []].flat()) {
    const m = PICK.exec(value);
    if (m) picks[m[1]] = m[2];
  }
  return picks;
}

/** 칸 하나를 바꾼(placeId 가 없으면 되돌린) 주소 — 다른 칸에서 바꾼 것은 그대로 둔다 */
function hrefWith(base: string, picks: Record<string, string>, slotKey: string, placeId?: string): string {
  const next = { ...picks };
  if (placeId) next[slotKey] = placeId;
  else delete next[slotKey];
  const query = new URLSearchParams(Object.entries(next).map(([k, v]) => ["pick", `${k}~${v}`]));
  return query.size > 0 ? `${base}?${query}` : base;
}

export default function ItineraryPage({ params, searchParams }: PageProps<"/breaks/[start]/[region]">) {
  return (
    <>
      <SiteHeader />
      <SiteNotice />
      <main>
        <RevealSuspense fallback={<ItinerarySkeleton />}>
          <Itinerary params={params} searchParams={searchParams} />
        </RevealSuspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Itinerary({ params, searchParams }: PageProps<"/breaks/[start]/[region]">) {
  const { start, region } = await params;
  const query = await searchParams;
  const picks = parsePicks(query.pick);
  const saveFailed = query.save === "failed";
  const base = `/breaks/${start}/${region}`;
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
      picks,
    });
  } catch (e) {
    if (e instanceof PublicDataError) return <SourceError subject="여행 정보" failure={e.failure} code={e.code} />;
    throw e;
  }
  if (!plan) notFound();

  const loggedIn = Boolean(await currentUser());
  const saveTarget = { start, region, picks, here: hrefWith(base, picks, "") };

  // 소개 글은 기다리지 않는다 — 날마다 Suspense 로 늦게 채운다(호출은 한 번).
  // 사용자가 바꾼 일정에는 붙이지 않는다 — 바꿀 때마다 부르면 조합 수만큼 비용이 는다.
  const summaries = plan.customized ? Promise.resolve(undefined) : describeItinerary(plan);
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

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-10 sm:px-6 sm:pb-10">
        <div className="mb-8">
          <SaveCard loggedIn={loggedIn} target={saveTarget} />
        </div>
        <div className="mb-8 space-y-3">
          {saveFailed && <Notice tone="highlight">여행 정보를 잠깐 불러오지 못해 저장하지 못했어요. 잠시 뒤 다시 저장해 주세요.</Notice>}
          {plan.customized && (
            <Notice
              tone="highlight"
              action={
                <Link
                  href={base}
                  scroll={false}
                  className="inline-flex h-10 items-center rounded-full border-[2.5px] border-ink bg-surface px-4 font-display"
                >
                  처음 일정으로
                </Link>
              }
            >
              직접 바꾼 칸이 있어요. 바꾼 일정에는 AI 소개가 붙지 않아요.
            </Notice>
          )}
          {noWeather && <Notice>날씨는 출발 10일 전부터 일정에 반영해요.</Notice>}
        </div>

        <div className="space-y-12">
          {plan.days.map((day, i) => (
            <ItineraryDay
              key={day.dayNumber}
              day={day}
              hrefFor={(slotKey, placeId) => hrefWith(base, picks, slotKey, placeId)}
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
      <SaveBar loggedIn={loggedIn} target={saveTarget} />
    </>
  );
}
