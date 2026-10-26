import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-full border-[3px] border-ink bg-coral">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </span>
        <span className="font-display text-[22px]">연휴 여행 플래너</span>
      </Link>
      <Link href="/#breaks" className="rounded-full px-3 py-2 font-display text-[17px] hover:bg-yellow">
        연휴 목록
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t-[3px] border-ink px-4 py-10 sm:px-6">
      <span className="font-display text-[26px]">즐거운 연휴 보내세요</span>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <li>공휴일 정보는 한국천문연구원</li>
        <li>관광 정보와 사진은 한국관광공사</li>
        <li>날씨는 기상청</li>
      </ul>
    </footer>
  );
}
