/** 공공데이터포털 실패 종류 — 화면 문구와 로그를 가른다(server-only 가 아니라 테스트할 수 있다). */
export type PublicDataFailure =
  /** 서버에 인증키(환경변수)가 없다 */
  | "missing-key"
  /** 하루 호출 한도를 넘었다 — 결과 코드 22 */
  | "quota"
  /** 공공데이터포털이 요청을 거절했다 — 키 미등록·만료 등 */
  | "rejected"
  /** 연결 실패·5xx·알 수 없는 응답 */
  | "unavailable";

/** 한도 초과(LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR) — 게이트웨이 거절 코드와 결과 코드 모두 22 로 온다 */
const QUOTA_CODES = new Set(["22"]);

/** 거절 코드 → 실패 종류 */
export const failureOfCode = (code: string): PublicDataFailure => (QUOTA_CODES.has(code) ? "quota" : "rejected");
