import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findSavedItinerary, type SavedItineraryView } from "@/contexts/itinerary";
import { currentUserId } from "@/shared/auth/session";
import { rangeText } from "@/shared/kernel/korean";
import { toggleFavoriteAction } from "../../actions";
import { DAY_TONES, ItineraryDay } from "../../_components/itinerary-day";
import { ItineraryMap, type MapDay } from "../../_components/itinerary-map";
import { PageBand } from "../../_components/page-band";
import { ShareButtons } from "../../_components/share-buttons";
import { RevealSuspense } from "../../_components/reveal";
import { BandSkeleton } from "../../_components/skeletons";
import { SiteFooter, SiteHeader, SiteNotice } from "../../_components/site-header";

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

/** 미리보기·카톡 카드에 같이 쓰는 제목과 설명 */
function shareTextOf(view: SavedItineraryView): { title: string; description: string } {
  const { plan } = view;
  const places = plan.days.flatMap((d) => d.slots).filter((s) => s.place).length;
  return {
    title: `${plan.regionName} ${plan.lengthLabel} · ${view.breakTitle} 연휴`,
    description: `${rangeText(plan.startLabel, plan.endLabel)} 일정이에요. 갈 곳과 맛집 ${places}곳을 날마다 정리했어요.`,
  };
}

export default function SharedPage({ params, searchParams }: PageProps<"/t/[id]">) {
  return (
    <>
      <SiteHeader />
      <SiteNotice />
      <main>
        <RevealSuspense fallback={<BandSkeleton steps={["저장한 일정을 불러오는 중"]} />}>
          <Shared params={params} searchParams={searchParams} />
        </RevealSuspense>
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
  const share = shareTextOf(view);
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
        {justSaved && view.mine && <p className="mt-2 font-bold text-yellow">저장했어요. 카카오톡으로 보내거나 캘린더에 넣어 보세요.</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
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
          <Link href={replan} className="inline-flex h-11 items-center rounded-full px-0 text-[15px] text-soft-ink underline underline-offset-4 sm:px-4">
            이 일정으로 다시 짜기
          </Link>
        </div>
        {!viewerId && <p className="mt-2 text-sm text-soft-ink">카카오로 로그인하면 이 일정을 찜해 둘 수 있어요.</p>}
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
