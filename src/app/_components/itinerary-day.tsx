import Link from "next/link";
import type { ReactNode } from "react";
import type { DayView, SlotView, WeatherView } from "@/contexts/itinerary";
import type { MapPin } from "./kakao-map";
import { ZoomableImage } from "./zoomable-image";

/** 일차별 색 — 지도 핀·동선과 같은 순서 */
export const DAY_TONES: MapPin["tone"][] = ["yellow", "mint", "coral"];
const DAY_BG = { yellow: "bg-yellow", mint: "bg-mint", coral: "bg-coral", lavender: "bg-lavender", ink: "bg-ink" };

/** 칸 하나를 바꾸는(placeId 가 없으면 되돌리는) 주소 */
export type HrefFor = (slotKey: string, placeId?: string) => string;

export function ItineraryDay({
  day,
  summary,
  hrefFor,
}: {
  day: DayView;
  /** 그날 소개 글(늦게 채워진다) */
  summary?: ReactNode;
  /** 칸 바꾸기 주소 — 없으면 바꾸기를 보여 주지 않는다(저장한 일정) */
  hrefFor?: HrefFor;
}) {
  const tone = DAY_TONES[(day.dayNumber - 1) % DAY_TONES.length];
  return (
    <section aria-labelledby={`day-${day.dayNumber}`}>
      <h2 id={`day-${day.dayNumber}`} className="flex flex-wrap items-baseline gap-3">
        <span className={`-rotate-2 rounded-2xl border-[3px] border-ink px-4 py-0.5 font-display text-[28px] ${DAY_BG[tone]}`}>
          {day.dayNumber}일차
        </span>
        <span className="font-display text-[22px] text-muted">{day.dateLabel}</span>
      </h2>
      {day.weather && <WeatherChips weather={day.weather} />}
      {summary}

      <ol className="mt-5 space-y-3">
        {day.slots.map((slot) => (
          <li key={slot.key}>
            {slot.travelLabel && (
              <p className="mb-2 ml-4 flex items-center gap-1.5 text-sm text-muted">
                <span aria-hidden className="h-4 w-[2.5px] rounded bg-ink/30" />
                {slot.travelLabel}
              </p>
            )}
            <SlotCard slot={slot} hrefFor={hrefFor} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function WeatherChips({ weather }: { weather: WeatherView }) {
  return (
    <ul aria-label="날씨" className="mt-3 flex flex-wrap gap-2 text-sm">
      {weather.parts.map((part) => (
        <li key={part} className={`rounded-full px-3 py-1 ${weather.wet ? "bg-lavender font-bold" : "bg-surface"}`}>
          {part}
        </li>
      ))}
    </ul>
  );
}

/**
 * 일정 칸 — 역할마다 자리를 나눈다.
 * 왼쪽 시간 · 가운데 정보(사진·이름·종류) · 오른쪽 위 행동(별점과 리뷰) · 아랫단 대안(근처 다른 식당)
 */
function SlotCard({ slot, hrefFor }: { slot: SlotView; hrefFor?: HrefFor }) {
  const place = slot.place;
  return (
    <article className="overflow-hidden rounded-2xl border-[2.5px] border-ink bg-surface">
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <span className="w-10 shrink-0 pt-0.5 font-display text-[17px] sm:w-12">{slot.timeLabel}</span>

        {place?.imageUrl && (
          <ZoomableImage
            src={place.imageUrl}
            title={place.title}
            className="size-24 rounded-xl border-[2.5px] border-ink object-cover sm:size-32"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {place ? (
              <p className="font-display text-[19px] leading-snug sm:text-xl">{place.title}</p>
            ) : (
              <p className="font-display text-lg text-muted">{slot.note}</p>
            )}
            {place?.category &&
              (isMeal(slot) ? <FoodChips category={place.category} /> : <p className="mt-0.5 text-sm text-muted">{place.category}</p>)}
            {slot.picked && (
          <p className="mt-2 mr-2 inline-block rounded-full bg-yellow px-2.5 py-0.5 text-xs font-bold">직접 고른 곳</p>
        )}
        {slot.forRain && (
              <p className="mt-2 inline-block rounded-full bg-lavender px-2.5 py-0.5 text-xs font-bold">비 소식이 있어 실내로 골랐어요</p>
            )}
          </div>

          {place?.url && (
            // 카카오 로컬 API 는 별점을 주지 않는다 — 카카오맵 장소 페이지에서 별점과 리뷰를 본다
            <a
              href={place.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 shrink-0 items-center gap-1 self-start rounded-full border-2 border-ink bg-surface px-3 text-sm font-bold hover:bg-yellow"
            >
              별점과 리뷰 보기 <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      </div>

      {hrefFor && (slot.alternatives.length > 0 || slot.picked) && (
        <div className="flex flex-wrap items-center gap-1.5 border-t-2 border-dashed border-ink/25 bg-cream px-3 py-2.5 text-sm sm:px-4">
          <span className="mr-1 font-bold text-muted">{isMeal(slot) ? "다른 식당으로 바꾸기" : "다른 곳으로 바꾸기"}</span>
          {slot.alternatives.map((p) => (
            <Link
              key={p.id}
              href={hrefFor(slot.key, p.id)}
              scroll={false}
              title={p.category ? `${p.title} (${p.category})` : p.title}
              className="rounded-full border-2 border-ink/25 bg-surface px-2.5 py-0.5 hover:border-ink hover:bg-yellow"
            >
              {p.title}
            </Link>
          ))}
          {slot.picked && (
            <Link
              href={hrefFor(slot.key)}
              scroll={false}
              className="ml-auto rounded-full border-2 border-ink bg-surface px-3 py-0.5 font-bold hover:bg-yellow"
            >
              원래대로
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

const isMeal = (slot: SlotView) => slot.time === "lunch" || slot.time === "dinner";

/** 음식 종류를 칩으로 — 카카오는 「돈까스,우동」처럼 쉼표로 붙여 주니 나눈다 */
function FoodChips({ category }: { category: string }) {
  const kinds = category.split(/[,·]/).map((k) => k.trim()).filter(Boolean);
  return (
    <ul aria-label="음식 종류" className="mt-1.5 flex flex-wrap gap-1.5">
      {kinds.map((kind) => (
        <li key={kind} className="rounded-full border-2 border-ink bg-coral px-2.5 py-0.5 text-sm font-bold">
          {kind}
        </li>
      ))}
    </ul>
  );
}

/** AI 가 쓴 그날 소개 — AI 글이라는 걸 밝힌다 */
export async function DaySummary({ summaries, index }: { summaries: Promise<string[] | undefined>; index: number }) {
  const text = (await summaries)?.[index];
  if (!text) return null;
  return (
    <p className="mt-3 max-w-3xl leading-relaxed">
      <span className="mr-2 inline-block rounded-full bg-lavender px-2 py-0.5 align-[2px] text-xs font-bold">AI 소개</span>
      {text}
    </p>
  );
}

export function DaySummarySkeleton() {
  return <div aria-hidden className="mt-3 h-12 max-w-3xl animate-pulse rounded-xl bg-soft-ink" />;
}
