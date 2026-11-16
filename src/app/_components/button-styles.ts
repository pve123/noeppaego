/**
 * 버튼 모양 — 화면마다 높이·모서리가 조금씩 달라 나란히 놓으면 어긋나 보이던 것을 한곳에 모은다.
 *
 * - 행동 버튼(네모에 가까운 둥근 모서리): 다음 단계로 가거나 무언가를 하는 버튼. 크기 LG·MD 둘
 * - 칩(알약): 고르기·켜고 끄기·작은 보조 동작. 높이 하나
 * 같은 줄에 놓는 두 버튼은 같은 크기를 쓰고, 색(PRIMARY·SECONDARY)만 다르게 한다.
 */

/** 화면의 주인공 행동 — 첫 화면, 다음 연휴 띠, 없는 페이지 */
export const BUTTON_LG =
  "inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-[18px] px-7 font-display text-xl transition-transform hover:-translate-y-0.5";
/** 카드·시트 안 행동 */
export const BUTTON_MD =
  "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[16px] px-6 font-display text-lg transition-transform hover:-translate-y-0.5";

/** 코랄 — 한 화면에 하나 */
export const PRIMARY = "border border-ink/10 bg-coral text-ink shadow-pop-sm";
/** 흰 바탕 테두리 — 주인공 옆의 두 번째 선택 */
export const SECONDARY = "border border-ink/15 bg-surface text-ink";

/** 알약 칩 — 고르기와 작은 보조 동작 */
export const CHIP =
  "inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border border-ink/15 bg-surface px-4 font-display text-[16px] transition-colors hover:bg-yellow";
