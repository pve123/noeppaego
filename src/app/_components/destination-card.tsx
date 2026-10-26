import Image from "next/image";
import Link from "next/link";
import type { DestinationView, FestivalView } from "@/contexts/destination";

const BANDS = ["bg-yellow", "bg-mint", "bg-coral", "bg-lavender"];
/** 카드에 바로 보이는 축제 수 — 나머지는 접는다 */
const VISIBLE = 3;

export function DestinationCard({
  destination,
  rank,
  planHref,
}: {
  destination: DestinationView;
  rank: number;
  /** 이 지역 일정 페이지 */
  planHref: string;
}) {
  const { festivals } = destination;
  const shown = festivals.slice(0, VISIBLE);
  const rest = festivals.slice(VISIBLE);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border-[3px] border-ink bg-surface shadow-pop">
      <div className={`flex items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-4 ${BANDS[(rank - 1) % BANDS.length]}`}>
        <h3 className="min-w-0 font-display text-2xl leading-tight">
          <span className="mr-2 text-ink/60">{rank}</span>
          {destination.name}
        </h3>
        <span className="shrink-0 rotate-3 rounded-full border-[2.5px] border-ink bg-surface px-3 py-1 font-display text-[15px] tabular-nums">
          {destination.distanceKm}km
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-6 pt-4">
        <p className="font-bold">축제·행사 {festivals.length}개</p>
        <ul className="mt-3 space-y-3">
          {shown.map((f) => (
            <FestivalRow key={f.id} festival={f} />
          ))}
        </ul>
        {rest.length > 0 && (
          <details className="group mt-3">
            <summary className="cursor-pointer list-none font-display text-[17px] underline underline-offset-4">
              {rest.length}개 더 보기
            </summary>
            <ul className="mt-3 space-y-3">
              {rest.map((f) => (
                <FestivalRow key={f.id} festival={f} />
              ))}
            </ul>
          </details>
        )}
        <div className="mt-auto pt-5">
          <Link
            href={planHref}
            className="inline-flex h-12 items-center gap-2 rounded-2xl border-[3px] border-ink bg-coral px-5 font-display text-lg shadow-pop-sm transition-transform hover:-translate-y-0.5"
          >
            여기로 일정 짜기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function FestivalRow({ festival }: { festival: FestivalView }) {
  return (
    <li className="flex items-center gap-3">
      {festival.imageUrl ? (
        <Image
          src={festival.imageUrl}
          alt=""
          width={72}
          height={72}
          unoptimized
          className="size-[72px] shrink-0 rounded-xl border-[2.5px] border-ink object-cover"
        />
      ) : (
        <span aria-hidden className="size-[72px] shrink-0 rounded-xl border-[2.5px] border-ink bg-cream" />
      )}
      <div className="min-w-0">
        <p className="font-bold leading-snug">{festival.title}</p>
        <p className="text-sm text-muted">{festival.dateLabel}</p>
        <p className="truncate text-sm text-muted">{festival.address}</p>
      </div>
    </li>
  );
}
