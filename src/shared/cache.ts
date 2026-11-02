import { cacheLife } from "next/cache";

/** cacheLife 는 프로필 이름마다 따로 받는다(overload) — 이름별로 한 번씩 감싼다 */
const PROFILES = {
  seconds: () => cacheLife("seconds"),
  minutes: () => cacheLife("minutes"),
  hours: () => cacheLife("hours"),
  days: () => cacheLife("days"),
} as const;

/**
 * 바깥 서버 응답을 얼마나 캐시할지 — 성공은 오래(success), 실패는 잠깐(failure, 기본 몇 초)만 두고 다시 묻는다.
 * `use cache` 함수 안에서 부른다.
 */
export function cacheFor(ok: boolean, success: keyof typeof PROFILES, failure: keyof typeof PROFILES = "seconds"): void {
  PROFILES[ok ? success : failure]();
}
