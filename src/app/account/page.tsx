import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listFavorites } from "@/contexts/itinerary";
import { currentUser } from "@/shared/auth/session";
import { DeleteAccountForm } from "../_components/delete-account-form";
import { KakaoLoginButton } from "../_components/kakao-login-button";
import { PageBand } from "../_components/page-band";
import { RevealSuspense, Shimmer } from "../_components/reveal";
import { SiteFooter, SiteHeader, SiteNotice } from "../_components/site-header";

export const metadata: Metadata = {
  title: "내 계정 | 계획은 J가",
  robots: { index: false },
};

/** 내 계정 — 로그아웃과 탈퇴. 플레이 스토어 「계정 삭제」 요건의 앱 안 경로이기도 하다 */
export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <SiteNotice />
      <main>
        <PageBand title="내 계정" sub="로그인 정보와 저장한 일정을 관리해요." />
        {/* 왼쪽 끝은 제목 띠와 맞추고(6xl), 읽기 폭은 좁게(2xl) */}
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 [&>*]:max-w-2xl">
          <RevealSuspense fallback={<Shimmer className="h-96" />}>
            <Account />
          </RevealSuspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function Account() {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center">
        <p className="font-display text-[22px] text-balance">로그인하면 계정을 관리할 수 있어요.</p>
        <p className="mt-2 text-muted">탈퇴하려는 경우에도 먼저 로그인해 주세요.</p>
        <div className="mt-5">
          <KakaoLoginButton next="/account" />
        </div>
      </div>
    );
  }

  const favorites = await listFavorites(user.id);
  const mine = favorites.filter((f) => f.mine).length;
  const others = favorites.length - mine;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-[3px] border-ink bg-surface p-5 shadow-pop sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink bg-[#fee500]">
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="#000" d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.66 6.77l-.95 3.5a.4.4 0 0 0 .61.44l4.13-2.75c.51.06 1.03.09 1.55.09 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-[22px] leading-tight">{user.nickname ? `${user.nickname}님` : "카카오 계정"}</p>
            <p className="text-[15px] text-muted">카카오로 로그인했어요</p>
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <input type="hidden" name="next" value="/" />
          <button type="submit" className="h-11 rounded-full border-[2.5px] border-ink bg-surface px-5 font-display text-[17px] hover:bg-yellow">
            로그아웃
          </button>
        </form>
      </section>

      <Link
        href="/saved"
        className="flex items-center justify-between gap-3 rounded-3xl border-[3px] border-ink bg-surface px-5 py-4 font-display text-lg transition-transform hover:-translate-y-0.5 sm:px-6"
      >
        <span>찜한 일정 {favorites.length}개</span>
        <span aria-hidden>→</span>
      </Link>

      <section id="delete" aria-labelledby="delete-title" className="scroll-mt-24 rounded-3xl border-[3px] border-ink bg-surface p-5 sm:p-6">
        <h2 id="delete-title" className="font-display text-[24px]">
          탈퇴하기
        </h2>
        <p className="mt-1 text-[15px] text-muted">탈퇴하면 아래 정보가 바로 지워지고 되돌릴 수 없어요.</p>

        <ul className="mt-4 divide-y-2 divide-ink/10 overflow-hidden rounded-2xl border-[2.5px] border-ink text-[15px]">
          <Consequence label="내가 저장한 일정" value={`${mine}개`} note={mine > 0 ? "공유한 링크도 더 이상 열리지 않아요" : undefined} />
          <Consequence label="공유받아 찜한 일정" value={`${others}개`} note={others > 0 ? "원래 일정은 남고 내 찜만 지워져요" : undefined} />
          <Consequence label="카카오 회원 번호" value="삭제" note="다시 로그인하면 새 계정으로 시작해요" />
        </ul>

        <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-[14px] leading-relaxed text-muted">
          카카오 쪽 연결까지 끊으려면 카카오계정 설정의 <b className="text-ink">연결된 서비스 관리</b>에서 「계획은 J가」를 지워 주세요.
          자세한 내용은{" "}
          <Link href="/privacy" className="font-bold text-ink underline underline-offset-4">
            개인정보처리방침
          </Link>
          에 있어요.
        </p>

        <Suspense>
          <DeleteAccountForm />
        </Suspense>
      </section>
    </div>
  );
}

function Consequence({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="font-bold">{label}</p>
        {note && <p className="text-[14px] text-muted">{note}</p>}
      </div>
      <span className="shrink-0 rounded-full bg-coral/20 px-2.5 py-0.5 font-bold tabular-nums">{value}</span>
    </li>
  );
}
