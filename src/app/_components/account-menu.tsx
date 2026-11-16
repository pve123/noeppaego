"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KakaoLoginButton } from "./kakao-login-button";
import { NAV_ITEM_WIDE } from "./nav-item";

/**
 * 헤더 오른쪽 — 로그인했으면 찜한 일정과 맨 오른쪽 이름 버튼(누르면 내 계정·로그아웃), 아니면 카카오 로그인.
 * 휴대폰은 아래 탭이 대신한다. 로그인 뒤에는 보던 화면으로 돌아온다.
 */
export function AccountMenu({ loggedIn, nickname }: { loggedIn: boolean; nickname?: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = search ? `${pathname}?${search}` : pathname;

  if (!loggedIn) return <KakaoLoginButton next={here} label="카카오 로그인" size="sm" />;
  return (
    <div className="flex items-center gap-1">
      <Link href="/saved" aria-current={pathname === "/saved" ? "page" : undefined} className={NAV_ITEM_WIDE}>
        찜한 일정
      </Link>
      <UserMenu nickname={nickname} current={pathname === "/account"} />
    </div>
  );
}

/** 이름 버튼 — 누르면 아래로 내 계정·로그아웃. 바깥을 누르거나 Esc 로 닫는다 */
function UserMenu({ nickname, current }: { nickname?: string; current: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex h-11 w-full items-center rounded-xl px-3 text-left font-display text-[16px] hover:bg-cream";
  return (
    <div ref={box} className="relative ml-1 hidden sm:block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-10 max-w-[12em] items-center gap-1.5 rounded-full border border-ink/15 bg-surface pl-1.5 pr-3 font-display text-[16px] transition-colors hover:bg-yellow ${
          current ? "bg-yellow" : ""
        }`}
      >
        <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-soft-ink text-[14px]">
          {(nickname ?? "나").slice(0, 1)}
        </span>
        <span className="truncate">{nickname ? `${nickname}님` : "내 계정"}</span>
        <svg viewBox="0 0 24 24" aria-hidden className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-50 w-44 rounded-2xl border border-ink/10 bg-surface p-1.5 shadow-pop">
          <Link role="menuitem" href="/account" onClick={() => setOpen(false)} className={item}>
            내 계정
          </Link>
          <form action="/api/auth/logout" method="post">
            <input type="hidden" name="next" value="/" />
            <button role="menuitem" type="submit" className={`${item} text-muted`}>
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/** 로그인이 안 됐을 때·탈퇴했을 때 한 줄 안내 — 주소의 ?login= ·?account= 를 본다 */
export function LoginNotice() {
  const params = useSearchParams();
  const login = params.get("login");
  if (params.get("account") === "deleted") {
    return (
      <p role="status" className="mx-4 mb-2 max-w-6xl rounded-2xl bg-mint px-4 py-2 text-[15px] font-bold sm:mx-6 lg:mx-auto">
        탈퇴를 마쳤어요. 계정과 저장한 일정을 모두 지웠어요. 로그인 없이도 계속 쓸 수 있어요.
      </p>
    );
  }
  if (login !== "failed" && login !== "unavailable") return null;
  return (
    <p role="status" className="mx-4 mb-2 max-w-6xl rounded-2xl bg-coral px-4 py-2 text-[15px] font-bold sm:mx-6 lg:mx-auto">
      {login === "failed" ? "카카오 로그인을 마치지 못했어요. 다시 해 보세요." : "지금은 로그인을 쓸 수 없어요."}
    </p>
  );
}
