import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CalendarDate, findLongBreak, type LongBreakView } from "@/contexts/calendar";
import { findDestinations, reachPreferenceOf, type ReachPreference } from "@/contexts/destination";
import { PublicDataError } from "@/shared/public-data/public-data";
import { DestinationCard } from "../../_components/destination-card";
import { KakaoMap, type MapPin } from "../../_components/kakao-map";
import { LeaveLine, PeriodLine } from "../../_components/leave-text";
import { OriginSelect } from "../../_components/origin-select";
import { PageBand } from "../../_components/page-band";
import { ReachChips, reachLabel, reachQuery, widerThan } from "../../_components/reach-chips";
import { RevealSuspense } from "../../_components/reveal";
import { BandSkeleton, DestinationsSkeleton } from "../../_components/skeletons";
import { SiteFooter, SiteHeader, SiteNotice } from "../../_components/site-header";
import { SourceError } from "../../_components/source-error";
import { Steps } from "../../_components/steps";

export const metadata: Metadata = {
  title: "갈 곳 고르기 | 계획은 J가",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** 카드 머리 띠 색과 같은 순서 */
const PIN_TONES: MapPin["tone"][] = ["yellow", "mint", "coral", "lavender"];
/** 처음 그리는 선 수 — 더 많으면 출발지에서 뒤엉켜 읽을 수 없다 */
const ROUTES_SHOWN = 5;

export default function BreakPage({ params, searchParams }: PageProps<"/breaks/[start]">) {
  return (
    <>
      <SiteHeader />
      <SiteNotice />
      <main>
        <Steps current={2} hrefs={["/#breaks"]} />
        <RevealSuspense fallback={<BandSkeleton steps={["연휴를 확인하는 중"]} />}>
          <BreakDetail params={params} searchParams={searchParams} />
        </RevealSuspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function BreakDetail({ params, searchParams }: PageProps<"/breaks/[start]">) {
  const { start } = await params;
  const { from, reach } = await searchParams;
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
            <PeriodLine option={base} className="text-cream" />
            <LeaveLine option={base} className="mt-2" />
          </>
        }
      />
      <RevealSuspense fallback={<DestinationsSkeleton />}>
        <Destinations
          start={base.startIso}
          end={base.endIso}
          originId={typeof from === "string" ? from : undefined}
          reach={reachPreferenceOf(reach)}
        />
      </RevealSuspense>
    </>
  );
}

async function Destinations({ start, end, originId, reach }: { start: string; end: string; originId?: string; reach?: ReachPreference }) {
  let view;
  try {
    view = await findDestinations({ start, end, originId, reach });
  } catch (e) {
    if (e instanceof PublicDataError) return <SourceError subject="축제 정보" failure={e.failure} code={e.code} />;
    throw e;
  }
  const basePath = `/breaks/${start}`;

  return (
    <section aria-label="추천 지역" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* 출발지·거리를 한 상자에 — 출발지 목록은 그 자리에서 펼쳐져 아래 카드를 덮지 않는다 */}
      <div className="flex flex-col gap-4 rounded-3xl border-[2.5px] border-ink bg-surface p-4 sm:p-5">
        <OriginSelect origins={view.origins} selected={view.originId} selectedName={view.originName} basePath={basePath} query={reachQuery(view.reach, view.recommended)} />
        <ReachChips basePath={basePath} originId={view.originId} selected={view.reach} recommended={view.recommended} />
      </div>
      {/* 목록 머리 — 몇 곳인지와 어떤 조건으로 골랐는지를 한 줄 글자로 */}
      {view.destinations.length > 0 && (
        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <h2 className="font-display text-[24px] leading-tight">추천 지역 {view.destinations.length}곳</h2>
          <p className="text-[15px] text-muted">
            {view.originName}에서 {view.reachText ? `${view.reachText}에 있는` : "거리와 상관없이"} 곳을 축제가 많은 순서로 보여 드려요.
          </p>
        </div>
      )}

      {view.destinations.length === 0 ? (
        <EmptyDestinations basePath={basePath} originId={view.originId} reach={view.reach} recommended={view.recommended} reachText={view.reachText} />
      ) : (
        <>
          <ol className="mt-4 grid gap-5 md:grid-cols-2">
            {view.destinations.map((d, i) => (
              <li key={d.code} className="min-w-0">
                <DestinationCard destination={d} rank={i + 1} planHref={`/breaks/${start}/${d.code}`} />
              </li>
            ))}
          </ol>

          <div className="mt-14">
            <KakaoMap
              title="출발지에서 얼마나 먼지 보기"
              caption="차로 걸리는 시간은 막히지 않을 때 기준이에요. 도로 정보 © OpenStreetMap 기여자"
              tall
              label={`${view.originName}에서 추천 지역 ${view.destinations.length}곳까지 보여 주는 지도`}
              pins={[
                { id: "origin", ...view.origin, badge: "출발", label: view.originName, tone: "ink", anchor: true },
                ...view.destinations.map((d, i) => ({
                  id: d.code,
                  ...d.center,
                  badge: String(i + 1),
                  label: d.name,
                  tone: PIN_TONES[i % PIN_TONES.length],
                })),
              ]}
              // 출발지에서 지역까지 실제 도로를 그린다. 도로 표에 없으면(내 위치, 섬) 점선 직선으로 「어디서 어디까지」만
              routes={view.destinations.map((d, i) => ({
                tone: PIN_TONES[i % PIN_TONES.length],
                points: d.route ?? [view.origin, d.center],
                dashed: !d.route,
                // 선은 위에서 다섯 곳만 — 나머지는 핀이나 번호표를 누르면 그린다
                onlyWhenFocused: i >= ROUTES_SHOWN,
              }))}
              legend={view.destinations.map((d, i) => ({
                badge: String(i + 1),
                text: `${d.name} ${d.travelLabel}`,
                tone: PIN_TONES[i % PIN_TONES.length],
                // 누르면 출발지와 이 지역, 그 사이 선만
                pinIds: ["origin", d.code],
                routeIndexes: [i],
              }))}
            />
          </div>
        </>
      )}
    </section>
  );
}

/** 추천이 비었을 때 — 거리를 좁혀서 비었으면 한 단계 넓히는 버튼을 준다 */
function EmptyDestinations({
  basePath,
  originId,
  reach,
  recommended,
  reachText,
}: {
  basePath: string;
  originId: string;
  reach: ReachPreference;
  recommended: ReachPreference;
  reachText?: string;
}) {
  // 이미 거리 제한이 없으면(4일 이상 등) 넓혀도 같다 — 버튼을 주지 않는다
  const wider = reachText ? widerThan(reach) : undefined;
  return (
    <div className="mt-6 rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center">
      <p className="font-display text-[22px] text-balance">
        {wider && reachText ? `${reachText}에는 이 기간 축제가 없어요.` : "이 기간에 등록된 축제가 아직 없어요."}
      </p>
      <p className="mt-2 text-muted">{wider ? "범위를 넓히면 갈 곳이 나올 수 있어요." : "날짜가 가까워지면 다시 확인해 주세요."}</p>
      {wider && (
        <Link
          href={`${basePath}?from=${originId}${reachQuery(wider, recommended)}`}
          scroll={false}
          className="mt-5 inline-flex h-12 items-center rounded-[16px] border-[3px] border-ink bg-coral px-6 font-display text-lg shadow-pop-sm transition-transform hover:-translate-y-0.5"
        >
          「{reachLabel(wider)}」로 넓혀 보기
        </Link>
      )}
    </div>
  );
}
