import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <span className="flex size-11 items-center justify-center rounded-full border-[3px] border-ink bg-coral">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </span>
        <span className="font-display text-2xl">연휴 여행 플래너</span>
      </Link>
      <nav aria-label="주 메뉴" className="flex flex-wrap gap-2">
        <Link href="/#next" className="rounded-full px-3.5 py-2 font-display text-[17px] hover:bg-yellow">다음 연휴</Link>
        <Link href="/#breaks" className="rounded-full px-3.5 py-2 font-display text-[17px] hover:bg-yellow">연휴 모아보기</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-4 py-14 sm:px-6">
      <span className="font-display text-[clamp(26px,3vw,36px)]">그럼, 즐거운 연휴 보내요!</span>
      <span className="text-sm text-muted">공휴일: 한국천문연구원 · 관광 정보·사진: 한국관광공사</span>
    </footer>
  );
}
