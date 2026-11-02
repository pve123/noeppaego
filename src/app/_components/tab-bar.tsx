"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarIcon, HeartIcon, HomeIcon, UserIcon } from "./icons";

type Tab = { href: string; label: string; icon: ReactNode; active: (path: string) => boolean };

const TABS: Tab[] = [
  { href: "/", label: "홈", icon: <HomeIcon />, active: (p) => p === "/" },
  { href: "/#breaks", label: "연휴", icon: <CalendarIcon className="size-5" />, active: (p) => p.startsWith("/breaks") },
  { href: "/saved", label: "찜", icon: <HeartIcon />, active: (p) => p === "/saved" || p.startsWith("/t/") },
  { href: "/account", label: "내 계정", icon: <UserIcon />, active: (p) => p === "/account" },
];

/**
 * 휴대폰 아래 탭 — 엄지가 닿는 곳에 자주 가는 네 곳(홈·연휴·찜·내 계정). 넓은 화면은 위 헤더 메뉴를 쓴다.
 * 지금 있는 곳은 아이콘을 노란 알약에 담아 표시한다. 높이는 globals.css 의 --tab-bar-h 와 같다.
 */
export function TabBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="아래 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <ul className="grid h-[var(--tab-bar-h)] grid-cols-4">
        {TABS.map((tab) => {
          const on = tab.active(path);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={on ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[12px] ${on ? "font-bold text-ink" : "text-ink/55"}`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${on ? "bg-yellow" : ""}`}>{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
