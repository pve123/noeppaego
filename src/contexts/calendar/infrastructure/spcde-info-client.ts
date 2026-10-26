import "server-only";
import { cacheLife } from "next/cache";

/** 한국천문연구원 특일 정보 — 공휴일(getRestDeInfo). https://www.data.go.kr/data/15012690/openapi.do */
const ENDPOINT =
  "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

export type RestDay = { date: string; name: string };

export type HolidaySourceFailure =
  /** 서버에 인증키(환경변수)가 없다 */
  | "missing-key"
  /** 공공데이터포털이 요청을 거절했다 — 키 미등록·만료·한도 초과 등 */
  | "rejected"
  /** 연결 실패·5xx·알 수 없는 응답 */
  | "unavailable";

export class HolidaySourceError extends Error {
  constructor(
    readonly failure: HolidaySourceFailure,
    /** 공공데이터포털 결과 코드(있을 때만) — 로그·화면에 그대로 보여 줘도 되는 값 */
    readonly code?: string,
  ) {
    super(`공휴일 자료를 가져오지 못했습니다: ${failure}${code ? ` (${code})` : ""}`);
    this.name = "HolidaySourceError";
  }
}

/**
 * `use cache` 함수는 실패를 던지지 않고 값으로 돌려준다 —
 * 던진 에러는 캐시 경계를 넘으며 클래스·필드·메시지를 모두 잃어(digest 만 남는다) 실패 종류를 알 수 없다.
 */
export type RestDaysResult =
  | { ok: true; restDays: RestDay[] }
  | { ok: false; failure: HolidaySourceFailure; code?: string };

type SpcdeItem = { locdate: number; dateName: string; isHoliday: "Y" | "N" };
type SpcdeResponse = {
  response?: {
    header: { resultCode: string; resultMsg: string };
    body?: { items: "" | { item: SpcdeItem | SpcdeItem[] } };
  };
  /** 키 오류 등 게이트웨이가 거절할 때의 모양 */
  OpenAPI_ServiceResponse?: { cmmMsgHeader: { returnReasonCode: string } };
};

/**
 * 한 해의 공휴일(대체공휴일·임시공휴일 포함). 성공은 하루 캐시한다 — 개발 계정 한도가 하루 1만 건이다.
 * 실패는 몇 초만 캐시해 키를 고치면 바로 다시 묻는다.
 */
export async function fetchRestDays(year: number): Promise<RestDaysResult> {
  "use cache";

  const result = await request(year);
  if (result.ok) cacheLife("days");
  else cacheLife("seconds");
  return result;
}

async function request(year: number): Promise<RestDaysResult> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) return { ok: false, failure: "missing-key" };

  const url = new URL(ENDPOINT);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("solYear", String(year));
  url.searchParams.set("numOfRows", "100");
  url.searchParams.set("_type", "json");

  let res: Response;
  let body: string;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    body = await res.text();
  } catch (e) {
    // URL 에 키가 들어 있어 URL·에러 메시지는 남기지 않는다.
    console.warn(`[holiday] 특일 정보 연결 실패: ${(e as Error).name}`);
    return { ok: false, failure: "unavailable" };
  }

  const json = tryParse(body);
  const rejectedCode =
    json?.OpenAPI_ServiceResponse?.cmmMsgHeader.returnReasonCode ??
    body.match(/<returnReasonCode>(\d+)<\/returnReasonCode>/)?.[1];
  if (rejectedCode) {
    console.warn(`[holiday] 특일 정보가 거절했다 (status=${res.status}, code=${rejectedCode})`);
    return { ok: false, failure: "rejected", code: rejectedCode };
  }
  if (!res.ok || !json?.response) {
    console.warn(`[holiday] 특일 정보 응답을 읽지 못했다 (status=${res.status})`);
    return { ok: false, failure: "unavailable", code: String(res.status) };
  }

  const { header, body: payload } = json.response;
  if (header.resultCode !== "00") {
    console.warn(`[holiday] 특일 정보 결과 코드 ${header.resultCode}`);
    return { ok: false, failure: "rejected", code: header.resultCode };
  }

  const items = payload?.items ? payload.items.item : [];
  const restDays = (Array.isArray(items) ? items : [items])
    .filter((item) => item.isHoliday === "Y")
    .map((item) => {
      const d = String(item.locdate);
      return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, name: item.dateName };
    });
  return { ok: true, restDays };
}

function tryParse(body: string): SpcdeResponse | undefined {
  try {
    return JSON.parse(body);
  } catch {
    return undefined; // 키 오류는 _type=json 이어도 XML 로 올 때가 있다.
  }
}
