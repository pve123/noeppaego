/**
 * 관광공사 소개(overview)에서 카드에 쓸 소개 — 첫 문장만, 아주 길면 띄어쓰기에서 자르고 「…」(server-only 가 아니라 테스트할 수 있다).
 * 화면은 두 줄로 줄여 보여 주고 「더보기」로 편다 — 그래서 여기서는 넉넉히 둔다.
 * 소개에는 <br>·&nbsp; 같은 HTML 이 섞여 온다.
 */
export const INTRO_MAX = 200;

export function firstSentence(overview: string, max = INTRO_MAX): string | undefined {
  const text = overview
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  // 「…이다.」「…있다.」처럼 마침표로 끝나는 첫 문장(소수점 「1.5」에서는 끊지 않는다)
  const first = text.match(/^.+?[다요]\.(?=\s|$)|^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  if ([...first].length <= max) return first;
  const cut = [...first].slice(0, max).join("");
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,，·\s]+$/, "")}…`;
}
