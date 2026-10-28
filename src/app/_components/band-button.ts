/**
 * 공유 페이지 띠(PageBand) 위 버튼 모양 — 공유 버튼과 찜·다시 짜기 줄이 같은 칸에 맞춰 선다.
 * 휴대폰에서는 두 칸 격자에 칸 너비를 꽉 채우고, 넓은 화면에서는 글자만큼.
 */
export const BAND_BUTTON =
  "inline-flex h-11 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full border-[2.5px] border-cream px-3 font-display text-[16px] sm:w-auto sm:px-5 sm:text-[17px]";
/** 테두리만 — 눈에 띄게 할 버튼(카톡·찜한 상태)이 아닐 때 */
export const BAND_OUTLINE = "bg-transparent text-cream hover:bg-cream/10";
/** 버튼 묶음 — 휴대폰은 두 칸 격자, 넓은 화면은 묶음을 풀어 바깥 줄(BAND_LINE)에 한 줄로 늘어선다 */
export const BAND_ROW = "grid grid-cols-2 gap-2 sm:contents";
/** 넓은 화면에서 버튼 묶음들을 한 줄로 — 휴대폰에서는 묶음을 위아래로 쌓는다 */
export const BAND_LINE = "space-y-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:space-y-0";
