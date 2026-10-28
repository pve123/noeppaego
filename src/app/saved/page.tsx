import type { Metadata } from "next";
import Link from "next/link";
import { listFavorites } from "@/contexts/itinerary";
import { currentUser } from "@/shared/auth/session";
import { toggleFavoriteAction } from "../actions";
import { KakaoLoginButton } from "../_components/kakao-login-button";
import { PageBand } from "../_components/page-band";
import { RevealSuspense } from "../_components/reveal";
import { FavoritesSkeleton } from "../_components/skeletons";
import { SiteFooter, SiteHeader, SiteNotice } from "../_components/site-header";

export const metadata: Metadata = {
  title: "찜한 일정 | 계획은 J가",
};

export default function SavedPage() {
  return (
    <>
        <SiteHeader />
        <SiteNotice />
        <main>
          <PageBand title="찜한 일정" sub="내가 저장한 일정과 공유받아 찜한 일정이에요." />
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <RevealSuspense fallback={<FavoritesSkeleton />}>
              <Favorites />
            </RevealSuspense>
          </div>
        </main>
        <SiteFooter />
    </>
  );
}

async function Favorites() {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center">
        <p className="font-display text-[22px] text-balance">로그인하면 찜한 일정을 볼 수 있어요.</p>
        <p className="mt-2 text-muted">일정을 저장하고 찜해 두면 여기에 모여요.</p>
        <div className="mt-5">
          <KakaoLoginButton next="/saved" />
        </div>
      </div>
    );
  }

  const favorites = await listFavorites(user.id);
  const account = <SignedInAs nickname={user.nickname} />;
  if (favorites.length === 0) {
    return (
      <>
        {account}
        <div className="rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center">
          <p className="font-display text-[22px] text-balance">아직 찜한 일정이 없어요.</p>
          <p className="mt-2 text-muted">일정 화면에서 「일정 저장하고 공유하기」를 눌러 보세요.</p>
          <Link href="/#breaks" className="mt-4 inline-flex h-12 items-center rounded-full border-[3px] border-ink bg-yellow px-6 font-display text-lg">
            연휴 고르러 가기
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {account}
      <ul className="grid gap-5 md:grid-cols-2">
        {favorites.map((f) => (
          <li key={f.id} className="flex flex-col overflow-hidden rounded-3xl border-[3px] border-ink bg-surface shadow-pop">
            <Link href={`/t/${f.id}`} className="border-b-[3px] border-ink bg-mint px-5 py-3.5">
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
    </>
  );
}

/** 지금 로그인한 카카오 계정 — 휴대폰과 PC가 다른 카카오 계정이면 찜 목록도 달라서, 어느 계정인지 먼저 보여 준다 */
function SignedInAs({ nickname }: { nickname?: string }) {
  return (
    <p className="mb-6 text-[15px] text-muted">
      <span className="font-bold text-ink">{nickname ? `${nickname}님` : "카카오 계정"}</span>으로 로그인했어요.
    </p>
  );
}
