import Image from "next/image";
import Link from "next/link";

function Logo({ size }: { size: number }) {
  return <Image src="/logo.svg" alt="" width={size} height={size} unoptimized className="shrink-0" />;
}

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <Logo size={40} />
        <span className="font-display text-[22px]">연휴 여행 플래너</span>
      </Link>
      <Link href="/#breaks" className="rounded-full px-3 py-2 font-display text-[17px] hover:bg-yellow">
        연휴 목록
      </Link>
    </header>
  );
}

const SOURCES = [
  { what: "공휴일", who: "한국천문연구원" },
  { what: "관광 정보와 사진", who: "한국관광공사" },
  { what: "날씨", who: "기상청" },
  { what: "지도와 맛집", who: "카카오" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-[3px] border-ink bg-mint">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-8 px-4 py-12 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo size={56} />
          <div>
            <p className="font-display text-[26px] leading-tight">연휴 여행 플래너</p>
            <p className="text-[15px]">즐거운 연휴 보내세요</p>
          </div>
        </div>
        <div>
          <p className="font-display text-lg">정보 출처</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <li key={s.who} className="rounded-full border-[2.5px] border-ink bg-surface px-3 py-1 text-sm">
                <span className="text-muted">{s.what}</span> <span className="font-bold">{s.who}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
