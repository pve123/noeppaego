"use client";

import Link from "next/link";
import { KakaoLoginButton } from "./kakao-login-button";
import { NAV_ITEM } from "./nav-item";
import { usePathname, useSearchParams } from "next/navigation";

/** 헤더 오른쪽 — 로그인했으면 찜한 일정·내 계정(로그아웃·탈퇴는 그 안에), 아니면 카카오 로그인. 로그인 뒤에는 보던 화면으로 돌아온다 */
export function AccountMenu({ loggedIn, nickname }: { loggedIn: boolean; nickname?: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = search ? `${pathname}?${search}` : pathname;

  if (!loggedIn) return <KakaoLoginButton next={here} label="카카오 로그인" size="sm" />;
  return (
    <div className="flex items-center gap-1">
      {/* 닉네임은 누르는 메뉴가 아니라 작은 이름표 — 메뉴와 같은 높이로 세우고 모양으로 구분한다 */}
      {nickname && (
        <span className="mr-1 hidden h-8 max-w-[10em] items-center truncate rounded-full bg-soft-ink px-3 text-[14px] font-bold leading-none sm:inline-flex">
          {nickname}님
        </span>
      )}
      <Link href="/saved" className={NAV_ITEM}>
        찜한 일정
      </Link>
      <Link href="/account" className={NAV_ITEM}>
        내 계정
      </Link>
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
