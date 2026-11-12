import type { Metadata } from "next";
import Link from "next/link";
import { BrainMascot } from "./_components/brain-mascot";
import { SiteFooter, SiteHeader } from "./_components/site-header";

export const metadata: Metadata = {
  title: "찾는 페이지가 없어요 | 뇌빼고",
};

/**
 * 없는 주소와 notFound() — 지운 공유 일정 링크를 받은 사람이 가장 자주 본다.
 * 사이트 모양 그대로 두고 갈 곳(홈, 연휴 목록)을 바로 준다.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <BrainMascot mood="puzzled" className="size-40" />
        <h1 className="mt-4 font-brand text-[34px] leading-tight">여기엔 아무것도 없어요</h1>
        <p className="mt-3 text-[17px] text-muted">
          <span className="block">주소가 바뀌었거나 지운 일정이에요.</span>
          <span className="block">연휴부터 다시 골라 볼까요?</span>
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link
            href="/#breaks"
            className="inline-flex h-14 items-center rounded-[18px] border border-ink/10 bg-coral px-7 font-display text-xl shadow-pop-sm"
          >
            연휴 고르러 가기
          </Link>
          <Link href="/" className="inline-flex h-14 items-center rounded-[18px] border border-ink/15 bg-surface px-7 font-display text-xl">
            홈으로
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
