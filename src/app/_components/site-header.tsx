import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { currentUser } from "@/shared/auth/session";
import { AccountMenu, LoginNotice } from "./account-menu";
import { NAV_ITEM_WIDE } from "./nav-item";
import { Toast } from "./toast";

/** 서비스 이름 — 「J」만 노랑으로 띄워 MBTI 의 J(계획형)가 눈에 들어오게 */
function BrandName() {
  return (
    <>
      계획은 <span className="rounded-lg bg-yellow px-1.5">J</span>가
    </>
  );
}

function Logo({ size }: { size: number }) {
  return <Image src="/logo.svg" alt="" width={size} height={size} unoptimized className="shrink-0" />;
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink/10 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <Logo size={40} />
        <span className="whitespace-nowrap font-display text-[20px] sm:text-[22px]">
          <BrandName />
        </span>
      </Link>
      <nav aria-label="주 메뉴" className="flex items-center gap-1">
        <Link href="/#breaks" className={NAV_ITEM_WIDE}>
          연휴 목록
        </Link>
        <Suspense fallback={<span className="inline-block h-10 w-28" />}>
          <Account />
        </Suspense>
      </nav>
      </div>
    </header>
  );
}

async function Account() {
  const user = await currentUser();
  return <AccountMenu loggedIn={Boolean(user)} nickname={user?.nickname} />;
}

/** 로그인 실패 안내(헤더 아래)와 저장·찜 알림(화면 아래) — 둘 다 주소의 표시를 본다 */
export function SiteNotice() {
  return (
    <Suspense>
      <LoginNotice />
      <Toast />
    </Suspense>
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
    <footer className="mt-16 border-t-[3px] border-ink bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-8 px-4 py-12 sm:px-6">
        <div className="flex items-start gap-3">
          <Logo size={56} />
          <div>
            <p className="font-display text-[26px] leading-tight">
              <BrandName />
            </p>
            {/* 슬로건을 메신저 대화처럼 — 묻는 말풍선(흰색)과 J의 대답(노랑) */}
            <div className="mt-2.5 flex flex-col items-start gap-1.5 font-display text-[16px]">
              <p className="-rotate-2 rounded-2xl rounded-bl-sm border-2 border-ink bg-surface px-3 py-1">너 P야?</p>
              <p className="ml-5 rotate-1 rounded-2xl rounded-br-sm border-2 border-ink bg-yellow px-3 py-1 shadow-pop-sm">
                계획은 <span className="rounded-md bg-ink px-1 text-cream">J</span>가 다 짤게
              </p>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <p className="font-display text-lg">정보 출처</p>
          {/* 휴대폰: 한 상자 안에 줄을 맞춘 표 / 넓은 화면: 칩 */}
          <ul className="mt-2 divide-y-2 divide-ink/10 overflow-hidden rounded-2xl border-[2.5px] border-ink bg-surface text-sm sm:flex sm:flex-wrap sm:gap-2 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent">
            {SOURCES.map((s) => (
              <li
                key={s.who}
                className="flex items-center justify-between gap-3 px-4 py-2.5 sm:gap-1.5 sm:rounded-full sm:border-[2.5px] sm:border-ink sm:bg-surface sm:px-3 sm:py-1"
              >
                <span className="text-muted">{s.what}</span> <span className="font-bold">{s.who}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t-2 border-ink/15">
        {/* 휴대폰에는 마우스 올림이 없어 밑줄을 늘 보여 준다 — 위 출처 칩(누르는 게 아님)과 모양으로 갈린다 */}
        <nav aria-label="정책" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-4 text-[14px] font-bold sm:px-6">
          {[
            { href: "/privacy", label: "개인정보처리방침" },
            { href: "/account#delete", label: "계정 삭제" },
          ].map((l, i) => (
            <span key={l.href} className="flex items-center gap-3">
              {i > 0 && (
                <span aria-hidden className="text-ink/40">
                  ·
                </span>
              )}
              <Link
                href={l.href}
                className="-mx-1 rounded-md px-1 py-1 underline decoration-ink/30 decoration-2 underline-offset-4 transition-colors hover:bg-ink/5 hover:decoration-ink"
              >
                {l.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}
