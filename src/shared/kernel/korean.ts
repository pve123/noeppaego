/**
 * 화면 문구를 기호(·, ,, –) 대신 조사로 잇는 도구.
 * 받침은 마지막 한글 글자로 보고, 숫자로 끝나면 숫자 읽는 소리로 본다(「12.24(목)」은 「목」).
 */
const DIGIT_HAS_BATCHIM: Record<string, boolean> = {
  "0": true, // 영
  "1": true, // 일
  "2": false, // 이
  "3": true, // 삼
  "4": false, // 사
  "5": false, // 오
  "6": true, // 육
  "7": true, // 칠
  "8": true, // 팔
  "9": false, // 구
};

export function hasBatchim(word: string): boolean {
  for (let i = word.length - 1; i >= 0; i--) {
    const ch = word[i];
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
    if (ch in DIGIT_HAS_BATCHIM) return DIGIT_HAS_BATCHIM[ch];
  }
  return false;
}

/** 「개천절과 추석」「설날과 대체공휴일과 …」 — 하나면 그대로 */
export function joinWithAnd(words: readonly string[]): string {
  return words.reduce((text, word, i) => (i === 0 ? word : `${text}${hasBatchim(text) ? "과" : "와"} ${word}`), "");
}

/** 「12.25(금)부터 12.27(일)까지」 — 같은 날이면 그날 하나 */
export function rangeText(from: string, to: string): string {
  return from === to ? from : `${from}부터 ${to}까지`;
}
