"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** 헤더 오른쪽 — 로그인했으면 찜한 일정·로그아웃, 아니면 카카오 로그인. 로그인 뒤에는 보던 화면으로 돌아온다 */
export function AccountMenu({ loggedIn, nickname }: { loggedIn: boolean; nickname?: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = search ? `${pathname}?${search}` : pathname;

  if (!loggedIn) {
    return (
      <Link
        href={`/api/auth/kakao?next=${encodeURIComponent(here)}`}
        prefetch={false}
        className="inline-flex h-10 items-center rounded-full bg-[#fee500] px-4 font-display text-[16px] text-[#191919] hover:brightness-95"
      >
        카카오로 로그인
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1">
      {nickname && <span className="mr-1 hidden max-w-[10em] truncate font-bold sm:inline">{nickname}님</span>}
      <Link href="/saved" className="rounded-full px-3 py-2 font-display text-[17px] hover:bg-yellow">
        찜한 일정
      </Link>
      <form action="/api/auth/logout" method="post">
        <input type="hidden" name="next" value={here} />
        <button type="submit" className="rounded-full px-3 py-2 text-[15px] text-muted hover:bg-yellow">
          로그아웃
        </button>
      </form>
    </div>
  );
}

/** 로그인이 안 됐을 때 한 줄 안내 — 주소의 ?login= 을 본다 */
export function LoginNotice() {
  const login = useSearchParams().get("login");
  if (login !== "failed" && login !== "unavailable") return null;
  return (
    <p role="status" className="mx-auto mb-2 max-w-6xl rounded-2xl bg-coral px-4 py-2 text-[15px] font-bold sm:mx-6 lg:mx-auto">
      {login === "failed" ? "카카오 로그인을 마치지 못했어요. 다시 해 보세요." : "지금은 로그인을 쓸 수 없어요."}
    </p>
  );
}
