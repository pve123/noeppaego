import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { listFavorites } from "@/contexts/itinerary";
import { currentUserId } from "@/shared/auth/session";
import { toggleFavoriteAction } from "../actions";
import { KakaoLoginButton } from "../_components/kakao-login-button";
import { PageBand } from "../_components/page-band";
import { SiteFooter, SiteHeader, SiteNotice } from "../_components/site-header";

export const metadata: Metadata = {
  title: "찜한 일정 | 연휴 여행 플래너",
};

const BANDS = ["bg-yellow", "bg-mint", "bg-coral", "bg-lavender"];

export default function SavedPage() {
  return (
    <>
      <SiteHeader />
      <SiteNotice />
      <main>
        <PageBand title="찜한 일정" sub="내가 저장한 일정과 공유받아 찜한 일정이에요." />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Suspense fallback={<div aria-busy="true" aria-label="불러오는 중" className="h-40 animate-pulse rounded-3xl bg-soft-ink" />}>
            <Favorites />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function Favorites() {
  const userId = await currentUserId();
  if (!userId) {
    return (
      <div className="rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center">
        <p className="font-display text-[22px]">로그인하면 찜한 일정을 볼 수 있어요.</p>
        <p className="mt-2 text-muted">일정을 저장하고 찜해 두면 여기에 모여요.</p>
        <div className="mt-5">
          <KakaoLoginButton next="/saved" />
        </div>
      </div>
    );
  }

  const favorites = await listFavorites(userId);
  if (favorites.length === 0) {
    return (
      <div className="rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center">
        <p className="font-display text-[22px]">아직 찜한 일정이 없어요.</p>
        <p className="mt-2 text-muted">일정 화면에서 「일정 저장하고 공유하기」를 눌러 보세요.</p>
        <Link href="/#breaks" className="mt-4 inline-flex h-12 items-center rounded-full border-[3px] border-ink bg-yellow px-6 font-display text-lg">
          연휴 고르러 가기
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {favorites.map((f, i) => (
        <li key={f.id} className="flex flex-col overflow-hidden rounded-3xl border-[3px] border-ink bg-surface shadow-pop">
          <Link href={`/t/${f.id}`} className={`border-b-[3px] border-ink px-5 py-3.5 ${BANDS[i % BANDS.length]}`}>
            <p className="text-sm font-bold">{f.breakTitle} 연휴</p>
            <p className="font-display text-[22px] leading-tight">{f.title}</p>
          </Link>
          <div className="flex flex-1 flex-wrap items-end justify-between gap-3 px-5 py-4">
            <p className="text-[15px] text-muted">
              {f.period}
              <br />
              {f.savedOn}에 저장
            </p>
            <form action={toggleFavoriteAction}>
              <input type="hidden" name="id" value={f.id} />
              <input type="hidden" name="favorite" value="0" />
              <input type="hidden" name="back" value="/saved" />
              <button type="submit" className="h-10 rounded-full border-2 border-ink/40 px-4 text-sm hover:border-ink">
                찜 풀기
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
