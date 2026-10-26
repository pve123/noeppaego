import Image from "next/image";
import type { DayView, PlaceView, SlotView } from "@/contexts/itinerary";
import type { MapPin } from "./kakao-map";

/** 일차별 색 — 지도 핀·동선과 같은 순서 */
export const DAY_TONES: MapPin["tone"][] = ["yellow", "mint", "coral"];
const DAY_BG = { yellow: "bg-yellow", mint: "bg-mint", coral: "bg-coral", lavender: "bg-lavender", ink: "bg-ink" };

export function ItineraryDay({ day }: { day: DayView }) {
  const tone = DAY_TONES[(day.dayNumber - 1) % DAY_TONES.length];
  return (
    <section aria-labelledby={`day-${day.dayNumber}`}>
      <h2 id={`day-${day.dayNumber}`} className="flex flex-wrap items-baseline gap-3">
        <span className={`-rotate-2 rounded-2xl border-[3px] border-ink px-4 py-1 font-display text-3xl ${DAY_BG[tone]}`}>
          {day.dayNumber}일차
        </span>
        <span className="font-display text-2xl text-muted">{day.dateLabel}</span>
      </h2>

      <ol className="mt-6 space-y-4 border-l-[3px] border-dashed border-ink pl-5 sm:pl-7">
        {day.slots.map((slot, i) => (
          <li key={slot.key} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[34px] top-5 flex size-7 items-center justify-center rounded-full border-[3px] border-ink font-display text-xs sm:-left-[42px] ${DAY_BG[tone]}`}
            >
              {slot.place ? i + 1 : ""}
            </span>
            <SlotCard slot={slot} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function SlotCard({ slot }: { slot: SlotView }) {
  return (
    <article className="rounded-3xl border-[3px] border-ink bg-surface p-4 shadow-pop-sm sm:p-5">
      <div className="flex items-start gap-4">
        {slot.place?.imageUrl ? (
          <Image
            src={slot.place.imageUrl}
            alt=""
            width={96}
            height={96}
            unoptimized
            className="size-20 shrink-0 rounded-2xl border-[2.5px] border-ink object-cover sm:size-24"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border-[2.5px] border-ink bg-cream px-2.5 py-0.5 font-display text-[15px]">
              {slot.timeLabel}
            </span>
            {slot.place?.category && <span className="text-sm font-bold text-muted">{slot.place.category}</span>}
            {slot.place?.indoor && slot.time !== "lunch" && slot.time !== "dinner" && (
              <span className="rounded-full bg-lavender px-2 py-0.5 text-xs font-bold">실내</span>
            )}
          </p>
          {slot.place ? <PlaceTitle place={slot.place} /> : <p className="mt-2 font-display text-xl text-muted">{slot.note}</p>}
          {slot.place && <p className="mt-0.5 truncate text-sm text-muted">{slot.place.address}</p>}
        </div>
      </div>

      {slot.alternatives.length > 0 && (
        <p className="mt-3 border-t-[2px] border-dashed border-ink/30 pt-3 text-sm">
          <span className="font-bold">근처 다른 곳 </span>
          {slot.alternatives.map((p, i) => (
            <span key={p.id}>
              {i > 0 && " · "}
              {p.url ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {p.title}
                </a>
              ) : (
                p.title
              )}
              {p.category && <span className="text-muted"> ({p.category})</span>}
            </span>
          ))}
        </p>
      )}
    </article>
  );
}

function PlaceTitle({ place }: { place: PlaceView }) {
  const title = <span className="font-display text-xl leading-snug sm:text-2xl">{place.title}</span>;
  return (
    <p className="mt-2">
      {place.url ? (
        <a href={place.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {title}
          <span className="ml-1 text-sm text-muted">카카오맵 ↗</span>
        </a>
      ) : (
        title
      )}
    </p>
  );
}
