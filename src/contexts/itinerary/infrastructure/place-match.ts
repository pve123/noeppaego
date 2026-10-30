/**
 * 관광공사 장소와 카카오 장소가 같은 곳인지(server-only 가 아니라 테스트할 수 있다).
 * 엉뚱한 곳의 리뷰로 보내지 않게 — 이름이 같거나 한쪽이 다른 쪽을 품고, 아주 가까울 때만 같다고 본다.
 */

/** 이보다 멀면 이름이 같아도 다른 지점으로 본다(m) */
const SAME_PLACE_M = 300;
/** 이만큼 붙어 있으면 「호텔미즈」「미즈호텔」처럼 종류 낱말 자리만 다른 이름도 같은 곳으로 본다(m) */
const RIGHT_HERE_M = 50;
/** 숙소 이름에서 자리를 바꿔 붙는 종류 낱말 */
const TYPE_WORDS = /호텔|모텔|펜션|리조트|게스트하우스|게하|한옥|스테이|hotel|motel|resort|stay/g;

/** 비교용 이름 — 괄호 안·띄어쓰기·대소문자를 뺀다. 「가람나무 (한옥스테이)」 → 「가람나무」 */
export const normalizeName = (name: string) => name.replace(/\([^)]*\)|\[[^\]]*\]/g, "").replace(/\s+/g, "").toLowerCase();

export function isSamePlace(tourTitle: string, kakaoName: string, distanceM: number): boolean {
  if (!(distanceM <= SAME_PLACE_M)) return false;
  const a = normalizeName(tourTitle);
  const b = normalizeName(kakaoName);
  if (a.length < 2 || b.length < 2) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  if (distanceM > RIGHT_HERE_M) return false;
  const bareA = a.replace(TYPE_WORDS, "");
  const bareB = b.replace(TYPE_WORDS, "");
  return bareA.length >= 2 && bareA === bareB;
}
