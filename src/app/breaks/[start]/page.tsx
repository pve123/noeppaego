import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CalendarDate, findLongBreak, type LongBreakView } from "@/contexts/calendar";
import { findDestinations } from "@/contexts/destination";
import { PublicDataError } from "@/shared/public-data/public-data";
import { DestinationCard } from "../../_components/destination-card";
import { KakaoMap, type MapPin } from "../../_components/kakao-map";
import { NextBreak } from "../../_components/next-break";
import { SiteFooter, SiteHeader } from "../../_components/site-header";
import { SourceError } from "../../_components/source-error";

export const metadata: Metadata = {
  title: "어디 갈까? · 연휴 여행 플래너",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** 카드 머리 띠 색과 같은 순서 */
const PIN_TONES: MapPin["tone"][] = ["yellow", "mint", "coral", "lavender"];

export default function BreakPage({ params }: PageProps<"/breaks/[start]">) {
  return (
    <>
      <SiteHeader />
      <main>
        <Suspense fallback={<div aria-busy="true" aria-label="불러오는 중" className="h-96 animate-pulse bg-ink/90" />}>
          <BreakDetail params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function BreakDetail({ params }: Pick<PageProps<"/breaks/[start]">, "params">) {
  const { start } = await params;
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

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <Link href="/#breaks" className="font-display text-lg underline underline-offset-4">
          ← 연휴 목록
        </Link>
      </div>
      <NextBreak item={item} withLink={false} />
      <Suspense fallback={<DestinationsSkeleton />}>
        <Destinations start={item.base.startIso} end={item.base.endIso} />
      </Suspense>
    </>
  );
}

async function Destinations({ start, end }: { start: string; end: string }) {
  let view;
  try {
    view = await findDestinations({ start, end });
  } catch (e) {
    if (e instanceof PublicDataError) return <SourceError subject="축제 정보" failure={e.failure} code={e.code} />;
    throw e;
  }

  return (
    <section aria-labelledby="where" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <span className="-rotate-2 inline-block rounded-full border-[3px] border-ink bg-mint px-4 py-1.5 font-display text-[17px]">
        이 연휴에 열리는 축제 기준
      </span>
      <h2 id="where" className="mt-4 font-display text-[clamp(32px,4vw,48px)] leading-tight">
        이 연휴엔 여기 어때요?
      </h2>
      <p className="mt-2 text-[17px]">
        {view.originName}에서 {view.reachKm ? `${view.reachKm}km 안, ` : ""}축제가 많은 곳부터 골랐어요.
      </p>

      {view.destinations.length > 0 && (
        <div className="mt-8">
          <KakaoMap
            label={`${view.originName}에서 추천 지역 ${view.destinations.length}곳까지의 지도`}
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
      )}

      {view.destinations.length === 0 ? (
        <p className="mt-8 rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center font-display text-[22px]">
          이 기간에 등록된 축제가 아직 없어요. 가까워지면 다시 들러 주세요!
        </p>
      ) : (
        <ol className="mt-10 grid gap-6 md:grid-cols-2">
          {view.destinations.map((d, i) => (
            <li key={d.code} className="min-w-0">
              <DestinationCard destination={d} rank={i + 1} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function DestinationsSkeleton() {
  return (
    <div aria-busy="true" aria-label="갈 만한 곳을 찾는 중" className="mx-auto max-w-6xl animate-pulse px-4 py-20 sm:px-6">
      <div className="h-12 w-80 rounded-2xl bg-soft-ink" />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-72 rounded-3xl bg-soft-ink" />
        ))}
      </div>
    </div>
  );
}
