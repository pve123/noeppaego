import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { DayView, PlaceView, SlotView, WeatherView } from "@/contexts/itinerary";
import type { MapPin } from "./kakao-map";
import { ClampText } from "./clamp-text";
import { CONTACT_EMAIL } from "./contact";
import { foodEmojiOf } from "./food-emoji";
import { AddressBar } from "./place-address";
import { ZoomableImage } from "./zoomable-image";

/** 일차별 색 — 지도 핀·동선과 같은 순서 */
export const DAY_TONES: MapPin["tone"][] = ["yellow", "mint", "coral"];
const DAY_BG = { yellow: "bg-yellow", mint: "bg-mint", coral: "bg-coral", lavender: "bg-lavender", ink: "bg-ink" };

/**
 * 앞 장소에서 오는 길 — 카드 사이를 점선으로 잇고 그 위에 「🚗 약 12분」 알약. 차 아이콘 바탕은 그날 색.
 * 지금은 늘 「차로 약 N분」이지만, 예전에 저장한 일정에는 「직선 1.2km」가 남아 있을 수 있어 그때는 거리 아이콘으로 그린다.
 */
function TravelLeg({ label, tone }: { label: string; tone: MapPin["tone"] }) {
  const byCar = label.startsWith("차로 ");
  const text = byCar ? label.slice(3) : label;
  return (
    <div className="mb-1.5 flex items-center gap-2.5 pl-7">
      <span aria-hidden className="h-9 border-l-[3px] border-dashed border-ink/25" />
      <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/15 bg-surface py-0.5 pl-0.5 pr-3 text-[13px] font-bold tabular-nums text-ink/80">
        <span aria-hidden className={`flex size-7 items-center justify-center rounded-full border border-ink/15 ${DAY_BG[tone]}`}>
          {byCar ? (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 16v-3.5l2-4.5h9l3.5 4.5H20a1 1 0 0 1 1 1V16" />
              <path d="M5.5 12.5h12" />
              <circle cx="7" cy="16.5" r="1.8" fill="currentColor" />
              <circle cx="17" cy="16.5" r="1.8" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 19L19 5" strokeDasharray="3 3" />
            </svg>
          )}
        </span>
        {byCar && <span className="sr-only">다음 장소까지 차로</span>}
        {text}
      </p>
    </div>
  );
}

/** 칸 하나를 바꾸는(placeId 가 없으면 되돌리는) 주소 */
type HrefFor = (slotKey: string, placeId?: string) => string;

export function ItineraryDay({
  day,
  dayCount,
  summary,
  hrefFor,
}: {
  day: DayView;
  /** 일정 전체 날수 — 둘 이상이면 제목 옆에 다른 날로 바로 가는 칩을 둔다 */
  dayCount: number;
  /** 그날 소개 글(늦게 채워진다) */
  summary?: ReactNode;
  /** 칸 바꾸기 주소 — 없으면 바꾸기를 보여 주지 않는다(저장한 일정) */
  hrefFor?: HrefFor;
}) {
  const tone = DAY_TONES[(day.dayNumber - 1) % DAY_TONES.length];
  return (
    // scroll-mt — 위 칩으로 넘어왔을 때 제목 띠(68px) 밑에 맞춰 선다
    <section id={`d${day.dayNumber}`} aria-labelledby={`day-${day.dayNumber}`} className="scroll-mt-[68px]">
      {/* 제목 띠는 위에 붙어 따라오고, 오른쪽 칩으로 다른 날로 바로 넘어간다 — 긴 일정을 스크롤로 찾지 않게 */}
      <div className="sticky top-[68px] z-30 -mx-4 flex items-center gap-3 bg-cream/90 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6">
        <h2 id={`day-${day.dayNumber}`} className="flex min-w-0 flex-wrap items-baseline gap-x-3">
          <span className={`rounded-2xl border border-ink/10 px-4 py-0.5 font-display text-[28px] ${DAY_BG[tone]}`}>
            {day.dayNumber}일차
          </span>
          <span className="font-display text-[20px] text-muted sm:text-[22px]">{day.dateLabel}</span>
        </h2>
        {dayCount > 1 && <DayJump current={day.dayNumber} count={dayCount} />}
      </div>
      {day.weather && <WeatherChips weather={day.weather} />}
      {summary}

      <ol className="mt-5 space-y-3">
        {day.slots.map((slot) => (
          <li key={slot.key}>
            {slot.travelLabel && <TravelLeg label={slot.travelLabel} tone={tone} />}
            <SlotCard slot={slot} hrefFor={hrefFor} />
          </li>
        ))}
      </ol>
    </section>
  );
}

/** 다른 날로 바로 가기 — 1·2·3 동그라미, 지금 날은 그날 색으로 채운다 */
function DayJump({ current, count }: { current: number; count: number }) {
  return (
    <nav aria-label="다른 날로 가기" className="ml-auto flex shrink-0 gap-1">
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
        const here = n === current;
        return (
          <a
            key={n}
            href={`#d${n}`}
            aria-current={here ? "true" : undefined}
            aria-label={`${n}일차로`}
            className={`flex size-8 items-center justify-center rounded-full border-2 font-display text-[15px] transition-colors ${
              here ? `border-ink/10 ${DAY_BG[DAY_TONES[(n - 1) % DAY_TONES.length]]}` : "border-ink/25 bg-surface text-ink/70 hover:border-ink/30"
            }`}
          >
            {n}
          </a>
        );
      })}
    </nav>
  );
}

function WeatherChips({ weather }: { weather: WeatherView }) {
  return (
    <ul aria-label="날씨" className="mt-3 flex flex-wrap gap-1.5 text-[13px] sm:gap-2 sm:text-sm">
      {weather.parts.map((part) => (
        <li key={part} className={`whitespace-nowrap rounded-full px-2.5 py-1 sm:px-3 ${weather.wet ? "bg-lavender font-bold" : "bg-surface"}`}>
          {part}
        </li>
      ))}
    </ul>
  );
}

/**
 * 일정 칸 — 역할마다 자리를 나눈다.
 * 시간 · 정보(사진·이름·종류) · 행동(별점과 리뷰) · 아랫단 대안(근처 다른 곳).
 * 휴대폰은 폭이 좁아 시간과 리뷰를 이름 위 한 줄로 올리고, 대안은 옆으로 밀어 본다.
 */
function SlotCard({ slot, hrefFor }: { slot: SlotView; hrefFor?: HrefFor }) {
  const place = slot.place;
  return (
    <article className="overflow-hidden rounded-2xl border border-ink/15 bg-surface">
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <span className="hidden w-12 shrink-0 pt-0.5 font-display text-[17px] sm:block">{slot.timeLabel}</span>

        {place?.imageUrl ? (
          <ZoomableImage
            src={place.imageUrl}
            title={place.title}
            className="size-20 rounded-xl border border-ink/15 object-cover sm:size-32"
          />
        ) : (
          place && foodKindOf(slot, place) && <FoodTile category={place.category} kind={foodKindOf(slot, place)!} />
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex min-h-7 items-center justify-between gap-2 sm:hidden">
            <span className="font-display text-[15px] text-muted">{slot.timeLabel}</span>
            {place?.url && <ReviewLink href={place.url} compact />}
          </div>

          <div className="sm:flex sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              {place ? (
                <p className="font-display text-[19px] leading-snug sm:text-xl">{place.title}</p>
              ) : (
                <p className="font-display text-lg text-muted">{slot.note}</p>
              )}
              {place && <KindBadges slot={slot} place={place} />}
              {place && periodOf(place) && (
                <p className="mt-1.5 text-[13px] text-muted">
                  <WordWrap text={periodOf(place)!} />
                </p>
              )}
              {place?.intro && <ClampText text={place.intro} className="mt-1.5 text-[14px] leading-relaxed text-ink/80" />}
              {(slot.picked || slot.forRain) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {slot.picked && <p className="rounded-full bg-yellow px-2.5 py-0.5 text-xs font-bold">직접 고른 곳</p>}
                  {slot.forRain && (
                    <p className="rounded-full bg-lavender px-2.5 py-0.5 text-xs font-bold">비 소식이 있어 실내로 골랐어요</p>
                  )}
                </div>
              )}
            </div>
            {place?.url && (
              <span className="hidden sm:block">
                <ReviewLink href={place.url} />
              </span>
            )}
          </div>
        </div>
      </div>

      {place?.address && <AddressBar address={place.address} place={place} />}

      {hrefFor && (slot.alternatives.length > 0 || slot.picked) && (
        <div className="flex flex-col gap-2 border-t-2 border-dashed border-ink/25 bg-cream py-2.5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5 sm:px-4">
          {/* 휴대폰: 제목 줄(라벨 · 원래대로) 아래 후보를 옆으로 민다 / 넓은 화면: 한 줄에 이어 놓는다 */}
          <div className="flex items-center justify-between px-3 sm:contents">
            <span className="font-bold text-muted sm:mr-1">{slot.time === "cafe" ? "다른 카페로 바꾸기" : isMeal(slot) ? "다른 식당으로 바꾸기" : slot.time === "night" ? "다른 숙소로 바꾸기" : "다른 곳으로 바꾸기"}</span>
            {slot.picked && (
              <Link
                href={hrefFor(slot.key)}
                scroll={false}
                className="rounded-full border border-ink/15 bg-surface px-3 py-0.5 font-bold hover:bg-yellow sm:order-last sm:ml-auto"
              >
                원래대로
              </Link>
            )}
          </div>
          {slot.alternatives.length > 0 && (
            // 휴대폰: 옆으로 민다 — 오른쪽 끝을 흐리게 해 「더 있어요」를 보여 주고, 끝까지 밀면 마지막 칩이 흐림 밖으로 나오게 여백을 둔다
            <ul className="no-scrollbar flex snap-x gap-1.5 overflow-x-auto scroll-px-3 px-3 pr-10 [mask-image:linear-gradient(to_right,#000_calc(100%-36px),transparent)] sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none]">
              {slot.alternatives.map((p) => (
                <li key={p.id} className="shrink-0 snap-start">
                  <Link
                    href={hrefFor(slot.key, p.id)}
                    scroll={false}
                    title={p.category ? `${p.title} (${p.category})` : p.title}
                    className="block whitespace-nowrap rounded-full border-2 border-ink/25 bg-surface px-2.5 py-0.5 hover:border-ink/30 hover:bg-yellow"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

/** 카카오 로컬 API 는 별점을 주지 않는다 — 카카오맵 장소 페이지에서 별점과 리뷰를 본다 */
function ReviewLink({ href, compact = false }: { href: string; compact?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-ink/15 bg-surface font-bold hover:bg-yellow ${
        compact ? "h-7 px-2.5 text-xs" : "h-9 px-3 text-sm"
      }`}
    >
      별점과 리뷰 <span aria-hidden>↗</span>
    </a>
  );
}

/**
 * 띄어쓰기에서만 줄을 바꾼다 — 「2026.10.11(일)까지」처럼 괄호 뒤에서 끊기면 「까지」만 아랫줄에 남는다.
 */
function WordWrap({ text }: { text: string }) {
  // 띄어쓰기는 span 밖에 둬야 거기서 줄이 바뀐다
  return text.split(" ").map((word, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span className="whitespace-nowrap">{word}</span>
    </Fragment>
  ));
}

const isMeal = (slot: SlotView) => slot.time === "lunch" || slot.time === "dinner";

/** 예전에 저장한 축제는 분류 칸에 「…부터 …까지 축제」로 기간이 들어 있다 */
const OLD_FESTIVAL = / 축제$/;
const isOldFestival = (place: PlaceView) => !place.kind && !!place.category && OLD_FESTIVAL.test(place.category) && place.category.includes("까지");
const periodOf = (place: PlaceView) => place.period ?? (isOldFestival(place) ? place.category!.replace(OLD_FESTIVAL, "") : undefined);

const KIND_LABEL: Partial<Record<NonNullable<PlaceView["kind"]>, string>> = { sight: "관광지", culture: "문화시설", festival: "축제", lodging: "숙소" };
/** 종류마다 뱃지 색 — 식당 코랄 · 카페 피치 · 관광지 민트 · 축제 노랑 · 숙소 라벤더 */
const KIND_TONE: Record<NonNullable<PlaceView["kind"]>, string> = {
  restaurant: "bg-coral",
  cafe: "bg-peach",
  sight: "bg-mint",
  culture: "bg-mint",
  festival: "bg-yellow",
  lodging: "bg-lavender",
};

/**
 * 종류 뱃지 — 모든 장소가 같은 모양, 색으로 종류를 가른다.
 * 식당·카페는 카카오가 「돈까스,우동」「제과,베이커리」처럼 쉼표로 붙여 주니 나눠서 여러 개로.
 */
/** 식당·카페 칸이면 그 종류 — 사진이 없을 때 메뉴 그림 타일을 둔다 */
function foodKindOf(slot: SlotView, place: PlaceView): "restaurant" | "cafe" | undefined {
  if (place.kind === "restaurant" || place.kind === "cafe") return place.kind;
  if (place.kind) return undefined;
  return slot.time === "cafe" ? "cafe" : isMeal(slot) ? "restaurant" : undefined;
}

/** 사진 없는 식당·카페 자리 — 메뉴 그림을 연한 사각형에 담아 카드 모양을 맞춘다 */
function FoodTile({ category, kind }: { category?: string; kind: "restaurant" | "cafe" }) {
  return (
    <span
      aria-hidden
      className={`flex size-20 shrink-0 items-center justify-center rounded-xl text-[34px] sm:size-32 sm:text-[52px] ${kind === "cafe" ? "bg-peach/25" : "bg-coral/15"}`}
    >
      {foodEmojiOf(category, kind)}
    </span>
  );
}

function KindBadges({ slot, place }: { slot: SlotView; place: PlaceView }) {
  const kind = place.kind ?? (isMeal(slot) ? "restaurant" : slot.time === "night" ? "lodging" : isOldFestival(place) ? "festival" : "sight");
  const labels =
    kind === "restaurant" || kind === "cafe"
      ? (place.category ?? "").split(/[,·]/).map((k) => k.trim()).filter(Boolean)
      : [isOldFestival(place) ? "축제" : (place.category ?? KIND_LABEL[kind] ?? "")].filter(Boolean);
  if (labels.length === 0) return null;
  return (
    <ul aria-label="종류" className="mt-1.5 flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <li key={label} className={`rounded-full border border-ink/15 px-2.5 py-0.5 text-[13px] font-bold ${KIND_TONE[kind]}`}>
          {label}
        </li>
      ))}
    </ul>
  );
}

/** AI 가 쓴 그날 소개 — AI 글이라는 걸 밝힌다 */
export async function DaySummary({ summaries, index }: { summaries: Promise<string[] | undefined>; index: number }) {
  const text = (await summaries)?.[index];
  return text ? <AiSummary text={text} /> : null;
}

/**
 * 하루 AI 소개 한 단락 — 「AI 소개」 표시와 신고 링크를 붙인다.
 * Play 「AI 생성 콘텐츠」 정책: AI가 만든 글을 보여 주면 사용자가 부적절한 내용을 알릴 방법이 있어야 한다.
 */
export function AiSummary({ text }: { text: string }) {
  const report = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("[계획은 J가] AI 소개 신고")}&body=${encodeURIComponent(`이상한 내용:\n${text}\n\n어떤 점이 문제인지 적어 주세요:\n`)}`;
  return (
    <p className="mt-3 max-w-3xl leading-relaxed">
      <span className="mr-2 inline-block rounded-full bg-lavender px-2 py-0.5 align-[2px] text-xs font-bold">AI 소개</span>
      {text}{" "}
      <a href={report} className="whitespace-nowrap text-[13px] text-muted underline decoration-ink/30 underline-offset-4 hover:text-ink">
        내용이 이상해요
      </a>
    </p>
  );
}

export function DaySummarySkeleton() {
  return (
    <div className="mt-3 max-w-3xl space-y-2">
      <p className="inline-flex items-center gap-2 text-xs font-bold text-muted">
        <span className="rounded-full bg-lavender px-2 py-0.5 text-ink">AI 소개</span>
        AI가 소개를 쓰는 중
      </p>
      <div aria-hidden className="shimmer h-4 w-full rounded-md" />
      <div aria-hidden className="shimmer h-4 w-2/3 rounded-md" />
    </div>
  );
}
