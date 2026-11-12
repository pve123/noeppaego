import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalendarDate } from "@/contexts/calendar";
import { aiSummariesOn, describeItinerary, findSavedItinerary, planSavedItinerary, type SavedItineraryView } from "@/contexts/itinerary";
import { currentUserId } from "@/shared/auth/session";
import { rangeText } from "@/shared/kernel/korean";
import { toggleFavoriteAction } from "../../actions";
import { DaySummary, DaySummarySkeleton, ItineraryDay } from "../../_components/itinerary-day";
import { ItineraryMap } from "../../_components/itinerary-map";
import { mapDaysOf } from "../../_components/map-days";
import { BAND_BUTTON, BAND_LINE, BAND_OUTLINE, BAND_ROW } from "../../_components/band-button";
import { PageBand } from "../../_components/page-band";
import { ShareButtons } from "../../_components/share-buttons";
import { RevealSuspense } from "../../_components/reveal";
import { BandSkeleton } from "../../_components/skeletons";
import { Notice } from "../../_components/notice";
import { SiteFooter, SiteHeader, SiteNotice } from "../../_components/site-header";
import { prefsEntries } from "../../_components/trip-prefs";

/**
 * 카톡·메신저 미리보기 — 일정마다 「경기도 파주시 2박 3일 · 성탄절 연휴」로 보이게. 이미지는 옆의 opengraph-image.tsx.
 * 공유 링크는 아는 사람만 여는 것이라 검색엔진에는 올리지 않는다.
 */
export async function generateMetadata({ params }: PageProps<"/t/[id]">): Promise<Metadata> {
  const { id } = await params;
  const view = await findSavedItinerary({ id });
  if (!view) return { title: "공유받은 일정 | 계획은 J가", robots: { index: false } };

  const { title, description } = shareTextOf(view);
  return {
    title: `${title} | 계획은 J가`,
    description,
    robots: { index: false },
    openGraph: { title, description, locale: "ko_KR", type: "article", siteName: "계획은 J가" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** 미리보기·카톡 카드에 같이 쓰는 제목과 설명 — 저장한 제목만 쓴다(장소는 열 때 다시 짜므로 여기서는 짜지 않는다) */
function shareTextOf(view: SavedItineraryView): { title: string; description: string } {
  return {
    title: `${view.breakTitle} 연휴 ${view.regionName} ${view.lengthLabel}`,
    description: `${rangeText(view.startLabel, view.endLabel)} 일정이에요. 갈 곳과 맛집을 날마다 정리했어요.`,
  };
}

export default function SharedPage({ params }: PageProps<"/t/[id]">) {
  return (
    <>
      <SiteHeader />
      <SiteNotice />
      <main>
        <RevealSuspense fallback={<BandSkeleton steps={["저장한 일정을 불러오는 중"]} />}>
          <Shared params={params} />
        </RevealSuspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Shared({ params }: Pick<PageProps<"/t/[id]">, "params">) {
  const { id } = await params;
  const viewerId = await currentUserId();
  const view = await findSavedItinerary({ id, viewerId });
  if (!view) notFound();

  // 장소는 저장하지 않는다 — 열 때마다 지금 정보로 다시 짠다
  const today = CalendarDate.todayIn("Asia/Seoul", new Date());
  const plan = await planSavedItinerary(view, today.iso);
  if (!plan) notFound();
  const ai = aiSummariesOn();
  const summaries = !ai || plan.customized || plan.tailored ? Promise.resolve(undefined) : describeItinerary(plan);
  const share = shareTextOf(view);
  // 다시 짜기 — 저장할 때의 여행 취향과 바꾼 칸을 그대로 이어 간다
  const replanQuery = new URLSearchParams([
    ...prefsEntries(view.prefs ?? {}),
    ...Object.entries(view.picks).map(([k, v]): [string, string] => ["pick", `${k}~${v}`]),
  ]);
  const replan = `/breaks/${view.breakStart}/${view.regionCode}${replanQuery.size > 0 ? `?${replanQuery}` : ""}`;
  const mapDays = mapDaysOf(plan.days);

  return (
    <>
      <PageBand
        eyebrow={`${view.breakTitle} 연휴`}
        title={`${plan.regionName} ${plan.lengthLabel}`}
        sub={
          <>
            <span className="block">{rangeText(plan.startLabel, plan.endLabel)} 일정이에요.</span>
            {/* 문장마다 줄을 나눈다 — 한 덩어리로 두면 「그 뒤 / 바뀐」처럼 문장 중간에서 끊긴다 */}
            <span className="mt-1 block text-[14px]">{view.savedOn}에 저장했어요.</span>
            <span className="block text-[14px]">열 때마다 지금 정보로 다시 짜서 저장할 때와 다를 수 있어요.</span>
          </>
        }
      >
        <div className={`mt-4 ${BAND_LINE}`}>
          <ShareButtons
            id={view.id}
            {...share}
            calendar={{
              title: share.title,
              startIso: view.breakStart,
              regionName: plan.regionName,
              days: plan.days.map((d) => ({
                dayNumber: d.dayNumber,
                dateLabel: d.dateLabel,
                slots: d.slots.map((s) => ({ timeLabel: s.timeLabel, place: s.place && { title: s.place.title } })),
              })),
            }}
          />
          {/* 넓은 화면에서 한 줄로 설 때 보내기 버튼과 내 버튼 사이를 나눈다 */}
          <span aria-hidden className="hidden sm:mx-1 sm:block sm:h-7 sm:w-0.5 sm:rounded-full sm:bg-cream/30" />
          <div className={BAND_ROW}>
            <form action={toggleFavoriteAction} className="sm:contents">
              <input type="hidden" name="id" value={view.id} />
              <input type="hidden" name="favorite" value={view.favorite ? "0" : "1"} />
              <input type="hidden" name="back" value={`/t/${view.id}`} />
              <button
                type="submit"
                aria-pressed={view.favorite}
                className={`${BAND_BUTTON} ${view.favorite ? "bg-coral text-ink" : BAND_OUTLINE}`}
              >
                <span aria-hidden>{view.favorite ? "♥" : "♡"}</span>
                {view.favorite ? "찜했어요" : "찜하기"}
              </button>
            </form>
            <Link href={replan} className={`${BAND_BUTTON} ${BAND_OUTLINE}`}>
              <span className="sm:hidden">다시 짜기</span>
              <span className="hidden sm:inline">이 일정으로 다시 짜기</span>
            </Link>
          </div>
        </div>
        {!viewerId && <p className="mt-2 text-sm text-soft-ink">카카오로 로그인하면 이 일정을 찜해 둘 수 있어요.</p>}
      </PageBand>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          {/* 카카오 장소 정보에는 영업시간이 없다 — 연휴엔 쉬는 곳이 많아 가기 전에 확인하게 한 번 알린다 */}
          <Notice>연휴엔 쉬는 가게가 많아요. 가기 전에 영업시간을 꼭 확인해 주세요.</Notice>
        </div>
        <div className="space-y-12">
          {plan.days.map((day, i) => (
            <ItineraryDay
              key={day.dayNumber}
              dayCount={plan.days.length}
              day={day}
              summary={
                ai && (
                  <Suspense fallback={<DaySummarySkeleton />}>
                    <DaySummary summaries={summaries} index={i} />
                  </Suspense>
                )
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
