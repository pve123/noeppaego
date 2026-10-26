import Image from "next/image";
import type { ReactNode } from "react";
import type { DayView, PlaceView, SlotView, WeatherView } from "@/contexts/itinerary";
import type { MapPin } from "./kakao-map";

/** 일차별 색 — 지도 핀·동선과 같은 순서 */
export const DAY_TONES: MapPin["tone"][] = ["yellow", "mint", "coral"];
const DAY_BG = { yellow: "bg-yellow", mint: "bg-mint", coral: "bg-coral", lavender: "bg-lavender", ink: "bg-ink" };

export function ItineraryDay({ day, summary }: { day: DayView; /** 그날 소개 글(늦게 채워진다) */ summary?: ReactNode }) {
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
            <SlotCard slot={slot} />
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

function SlotCard({ slot }: { slot: SlotView }) {
  return (
    <article className="flex items-start gap-3 rounded-2xl border-[2.5px] border-ink bg-surface p-3 sm:gap-4 sm:p-4">
      <span className="mt-0.5 w-11 shrink-0 font-display text-[17px]">{slot.timeLabel}</span>
      {slot.place?.imageUrl && (
        <Image
          src={slot.place.imageUrl}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="size-14 shrink-0 rounded-xl border-2 border-ink object-cover sm:size-16"
        />
      )}
      <div className="min-w-0 flex-1">
        {slot.place ? <PlaceTitle place={slot.place} /> : <p className="font-display text-lg text-muted">{slot.note}</p>}
        {slot.place?.category && <p className="text-sm text-muted">{slot.place.category}</p>}
        {slot.forRain && (
          <p className="mt-1 inline-block rounded-full bg-lavender px-2 py-0.5 text-xs font-bold">비 소식이 있어 실내로 골랐어요</p>
        )}
        {slot.alternatives.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-muted">다른 곳</span>
            {slot.alternatives.map((p) =>
              p.url ? (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border-2 border-ink/30 px-2.5 py-0.5 hover:border-ink"
                >
                  {p.title}
                </a>
              ) : (
                <span key={p.id} className="rounded-full border-2 border-ink/20 px-2.5 py-0.5">
                  {p.title}
                </span>
              ),
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function PlaceTitle({ place }: { place: PlaceView }) {
  const title = <span className="font-display text-[19px] leading-snug sm:text-xl">{place.title}</span>;
  if (!place.url) return <p>{title}</p>;
  return (
    <p>
      <a href={place.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
        {title}
        <span className="ml-1.5 text-sm text-muted">카카오맵에서 보기</span>
      </a>
    </p>
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
