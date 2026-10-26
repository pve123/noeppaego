import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findSavedItinerary } from "@/contexts/itinerary";
import { currentUserId } from "@/shared/auth/session";
import { rangeText } from "@/shared/kernel/korean";
import { toggleFavoriteAction } from "../../actions";
import { CopyLinkButton } from "../../_components/copy-link-button";
import { DAY_TONES, ItineraryDay } from "../../_components/itinerary-day";
import { ItineraryMap, type MapDay } from "../../_components/itinerary-map";
import { PageBand } from "../../_components/page-band";
import { SiteFooter, SiteHeader, SiteNotice } from "../../_components/site-header";

export const metadata: Metadata = {
  title: "공유받은 일정 | 연휴 여행 플래너",
};

export default function SharedPage({ params, searchParams }: PageProps<"/t/[id]">) {
  return (
    <>
      <SiteHeader />
      <SiteNotice />
      <main>
        <Suspense fallback={<div aria-busy="true" aria-label="불러오는 중" className="mt-4 h-48 animate-pulse bg-ink/90" />}>
          <Shared params={params} searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Shared({ params, searchParams }: PageProps<"/t/[id]">) {
  const { id } = await params;
  const { saved: justSaved } = await searchParams;
  const viewerId = await currentUserId();
  const view = await findSavedItinerary({ id, viewerId });
  if (!view) notFound();

  const { plan } = view;
  const replan = `/breaks/${view.breakStart}/${view.regionCode}${
    Object.keys(view.picks).length > 0
      ? `?${new URLSearchParams(Object.entries(view.picks).map(([k, v]) => ["pick", `${k}~${v}`]))}`
      : ""
  }`;
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
      <PageBand
        eyebrow={`${view.breakTitle} 연휴`}
        title={`${plan.regionName} ${plan.lengthLabel}`}
        sub={
          <>
            {rangeText(plan.startLabel, plan.endLabel)} 일정이에요.
            <br />
            {view.savedOn}에 저장한 일정이라 그 뒤 바뀐 관광 정보는 들어 있지 않아요.
          </>
        }
      >
        {justSaved && view.mine && <p className="mt-2 font-bold text-yellow">저장했어요. 링크를 복사해서 공유해 보세요.</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CopyLinkButton />
          <form action={toggleFavoriteAction}>
            <input type="hidden" name="id" value={view.id} />
            <input type="hidden" name="favorite" value={view.favorite ? "0" : "1"} />
            <input type="hidden" name="back" value={`/t/${view.id}`} />
            <button
              type="submit"
              aria-pressed={view.favorite}
              className={`inline-flex h-11 items-center rounded-full border-[2.5px] border-cream px-5 font-display text-[17px] ${
                view.favorite ? "bg-coral text-ink" : "bg-transparent text-cream hover:bg-cream/10"
              }`}
            >
              {view.favorite ? "찜했어요" : "찜하기"}
            </button>
          </form>
          <Link href={replan} className="inline-flex h-11 items-center rounded-full px-4 text-[15px] text-soft-ink underline underline-offset-4">
            이 일정으로 다시 짜기
          </Link>
        </div>
      </PageBand>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="space-y-12">
          {plan.days.map((day, i) => (
            <ItineraryDay
              key={day.dayNumber}
              // 저장한 때의 예보라 지금과 다를 수 있어 날씨는 보여 주지 않는다
              day={{ ...day, weather: undefined }}
              summary={
                view.summaries?.[i] ? (
                  <p className="mt-3 max-w-3xl leading-relaxed">
                    <span className="mr-2 inline-block rounded-full bg-lavender px-2 py-0.5 align-[2px] text-xs font-bold">AI 소개</span>
                    {view.summaries[i]}
                  </p>
                ) : undefined
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
