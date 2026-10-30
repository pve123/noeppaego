/**
 * 헤더 메뉴 한 칸 — 높이를 정하고 가운데로 세운다. 글꼴(Jua·본문)마다 글자 높이가 달라 높이 없이 두면 들쭉날쭉하다.
 * 서버 컴포넌트(site-header)와 클라이언트 컴포넌트(account-menu)가 같이 쓴다.
 */
const NAV_ITEM_SHAPE =
  "h-10 items-center whitespace-nowrap rounded-full px-2.5 font-display text-[17px] leading-none transition-colors hover:bg-yellow sm:px-3";
/** 넓은 화면에서만 보이는 메뉴 — 휴대폰은 아래 탭(TabBar)이 대신한다 */
export const NAV_ITEM_WIDE = `hidden sm:inline-flex ${NAV_ITEM_SHAPE}`;
