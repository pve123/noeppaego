import Image from "next/image";
import Link from "next/link";
import type { DestinationView, FestivalView } from "@/contexts/destination";

const BANDS = ["bg-yellow", "bg-mint", "bg-coral", "bg-lavender"];
/** 카드에 보이는 축제 수 — 고르는 데는 두 개면 충분하다. 사진은 맨 위에 하나만 크게 */
const VISIBLE = 2;

/** 갈 곳 카드 — 카드 전체가 「일정 보기」 링크다 */
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
  const more = festivals.length - VISIBLE;
  const cover = festivals.find((f) => f.imageUrl)?.imageUrl;

  return (
    <Link href={planHref} className="group block h-full rounded-3xl outline-offset-4">
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border-[3px] border-ink bg-surface shadow-pop transition-transform group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
        <div className={`flex flex-col items-start gap-2 border-b-[3px] sm:flex-row sm:items-center sm:justify-between sm:gap-3 border-ink px-5 py-3.5 ${BANDS[(rank - 1) % BANDS.length]}`}>
          <h3 className="min-w-0 font-display text-[22px] leading-tight [overflow-wrap:anywhere]">
            <span className="mr-2 text-ink/60">{rank}</span>
            {destination.name}
          </h3>
          <span className="shrink-0 rounded-full border-[2.5px] border-ink bg-surface px-3 py-0.5 font-display text-[15px] tabular-nums">
            {destination.driveLabel ?? `${destination.distanceKm}km`}
          </span>
        </div>

        {cover && (
          <Image
            src={cover}
            alt=""
            width={640}
            height={360}
            unoptimized
            className="shimmer aspect-[16/9] w-full border-b-[3px] border-ink object-cover"
          />
        )}
        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          <ul className="space-y-3">
            {festivals.slice(0, VISIBLE).map((f) => (
              <FestivalRow key={f.id} festival={f} />
            ))}
          </ul>
          {more > 0 && <p className="mt-3 text-sm text-muted">축제 {more}개 더 있어요</p>}
          <p className="mt-auto pt-4 text-right font-display text-lg">
            일정 보기 <span aria-hidden>→</span>
          </p>
        </div>
      </article>
    </Link>
  );
}

function FestivalRow({ festival }: { festival: FestivalView }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="mt-1.5 size-2.5 shrink-0 self-start rounded-full bg-coral ring-2 ring-ink" />
      <div className="min-w-0">
        <p className="font-bold leading-snug">{festival.title}</p>
        <p className="text-sm text-muted">{festival.dateLabel}</p>
      </div>
    </li>
  );
}
