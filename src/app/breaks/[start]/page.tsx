import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CalendarDate, findLongBreak, type LongBreakView } from "@/contexts/calendar";
import { findDestinations } from "@/contexts/destination";
import { PublicDataError } from "@/shared/public-data/public-data";
import { DestinationCard } from "../../_components/destination-card";
import { KakaoMap, type MapPin } from "../../_components/kakao-map";
import { leaveText, periodText } from "../../_components/leave-text";
import { OriginSelect } from "../../_components/origin-select";
import { PageBand } from "../../_components/page-band";
import { SiteFooter, SiteHeader } from "../../_components/site-header";
import { SourceError } from "../../_components/source-error";
import { Steps } from "../../_components/steps";

export const metadata: Metadata = {
  title: "갈 곳 고르기 | 연휴 여행 플래너",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** 카드 머리 띠 색과 같은 순서 */
const PIN_TONES: MapPin["tone"][] = ["yellow", "mint", "coral", "lavender"];

export default function BreakPage({ params, searchParams }: PageProps<"/breaks/[start]">) {
  return (
    <>
      <SiteHeader />
      <main>
        <Steps current={2} hrefs={["/#breaks"]} />
        <Suspense fallback={<div aria-busy="true" aria-label="불러오는 중" className="mt-4 h-40 animate-pulse bg-ink/90" />}>
          <BreakDetail params={params} searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function BreakDetail({ params, searchParams }: PageProps<"/breaks/[start]">) {
  const { start } = await params;
  const { from } = await searchParams;
  if (!ISO_DATE.test(start)) notFound();
  await connection(); // 「오늘」은 요청 시각 기준
  const today = CalendarDate.todayIn("Asia/Seoul", new Date());

  let item: LongBreakView | undefined;
  try {
    item = await findLongBreak({ start: CalendarDate.of(start), today });
  } catch (e) {
    if (e instanceof PublicDataError) return <SourceError subject="공휴일 정보" failure={e.failure} code={e.code} />;
    throw e;
  }
  if (!item) notFound();

  const { base } = item;
  return (
    <>
      <PageBand
        eyebrow={`${item.title} 연휴 ${base.length}일`}
        title="어디로 갈까요?"
        sub={
          <>
            {periodText(base)}
            <br />
            {leaveText(base)}
          </>
        }
      />
      <Suspense fallback={<DestinationsSkeleton />}>
        <Destinations start={base.startIso} end={base.endIso} originId={typeof from === "string" ? from : undefined} />
      </Suspense>
    </>
  );
}

async function Destinations({ start, end, originId }: { start: string; end: string; originId?: string }) {
  let view;
  try {
    view = await findDestinations({ start, end, originId });
  } catch (e) {
    if (e instanceof PublicDataError) return <SourceError subject="축제 정보" failure={e.failure} code={e.code} />;
    throw e;
  }

  return (
    <section aria-label="추천 지역" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[16px]">
          {view.originName}에서 {view.reachKm ? `${view.reachKm}km 안에서 ` : ""}축제가 많은 곳부터 보여 드려요.
        </p>
        <OriginSelect origins={view.origins} selected={view.originId} basePath={`/breaks/${start}`} />
      </div>

      {view.destinations.length === 0 ? (
        <p className="mt-8 rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center font-display text-[22px]">
          이 기간에 등록된 축제가 아직 없어요. 날짜가 가까워지면 다시 확인해 주세요.
        </p>
      ) : (
        <>
          <ol className="mt-6 grid gap-5 md:grid-cols-2">
            {view.destinations.map((d, i) => (
              <li key={d.code} className="min-w-0">
                <DestinationCard destination={d} rank={i + 1} planHref={`/breaks/${start}/${d.code}`} />
              </li>
            ))}
          </ol>

          <div className="mt-14">
            <KakaoMap
              title="지도로 보기"
              label={`${view.originName}에서 추천 지역 ${view.destinations.length}곳까지 보여 주는 지도`}
              pins={[
                { id: "origin", ...view.origin, badge: "출발", label: view.originName, tone: "ink" },
                ...view.destinations.map((d, i) => ({
                  id: d.code,
                  ...d.center,
                  badge: String(i + 1),
                  label: d.name,
                  tone: PIN_TONES[i % PIN_TONES.length],
                })),
              ]}
            />
          </div>
        </>
      )}
    </section>
  );
}

function DestinationsSkeleton() {
  return (
    <div aria-busy="true" aria-label="갈 곳을 찾는 중" className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6">
      <div className="h-11 w-80 rounded-2xl bg-soft-ink" />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-56 rounded-3xl bg-soft-ink" />
        ))}
      </div>
    </div>
  );
}
