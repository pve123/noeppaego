import "server-only";
import { failureOfCode, type PublicDataFailure } from "./failure";

/**
 * 공공데이터포털(apis.data.go.kr) 호출 공통 — 인증키·거절 코드·실패 처리.
 * 캐시는 여기서 하지 않는다. 각 클라이언트의 `use cache` 함수가 이걸 부르고 결과에 따라 수명을 정한다.
 */

export type { PublicDataFailure } from "./failure";

export class PublicDataError extends Error {
  constructor(
    readonly failure: PublicDataFailure,
    /** 공공데이터포털 결과 코드(있을 때만) — 화면에 그대로 보여 줘도 되는 값 */
    readonly code?: string,
  ) {
    super(`공공데이터를 가져오지 못했습니다: ${failure}${code ? ` (${code})` : ""}`);
    this.name = "PublicDataError";
  }
}

/**
 * `use cache` 함수는 실패를 던지지 않고 값으로 돌려준다 —
 * 던진 에러는 캐시 경계를 넘으며 클래스·필드·메시지를 모두 잃어(digest 만 남는다) 실패 종류를 알 수 없다.
 */
export type PublicDataResult<T> =
  | { ok: true; value: T }
  | { ok: false; failure: PublicDataFailure; code?: string };

/** 캐시 밖에서 결과를 값으로 바꾼다 — 실패면 PublicDataError 를 던진다. */
export function unwrap<T>(result: PublicDataResult<T>): T {
  if (!result.ok) throw new PublicDataError(result.failure, result.code);
  return result.value;
}

type Envelope<T> = {
  response?: {
    header: { resultCode: string; resultMsg: string };
    body?: { items: "" | { item: T | T[] }; totalCount?: number };
  };
  /** 키 오류 등 게이트웨이가 거절할 때의 모양 */
  OpenAPI_ServiceResponse?: { cmmMsgHeader: { returnReasonCode: string } };
};

/** 성공 결과 코드 — 서비스마다 자릿수가 다르다(천문연 `00`, 관광공사 `0000`). */
const OK_CODES = new Set(["00", "0000"]);

/**
 * 목록 API 한 번 호출. 항목이 하나면 객체, 없으면 빈 문자열로 오는 것을 배열로 맞춘다.
 * @param label 로그에 남길 이름 — URL 에 키가 들어 있어 URL 은 남기지 않는다.
 */
export async function requestItems<T>(
  label: string,
  endpoint: string,
  params: Record<string, string>,
): Promise<PublicDataResult<T[]>> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    console.warn(`[${label}] DATA_GO_KR_SERVICE_KEY 가 없다`);
    return { ok: false, failure: "missing-key" };
  }

  const url = new URL(endpoint);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("_type", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let res: Response;
  let body: string;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    body = await res.text();
  } catch (e) {
    console.warn(`[${label}] 연결 실패: ${(e as Error).name}`);
    return { ok: false, failure: "unavailable" };
  }

  const json = tryParse<Envelope<T>>(body);
  const rejectedCode =
    json?.OpenAPI_ServiceResponse?.cmmMsgHeader.returnReasonCode ??
    body.match(/<returnReasonCode>(\d+)<\/returnReasonCode>/)?.[1];
  if (rejectedCode) {
    // 30 이면 등록 안 된 키(막 받은 키는 1~2시간 뒤 활성), Encoding/Decoding 키 혼동도 흔하다. 22 는 하루 한도 초과.
    console.warn(`[${label}] 거절 (status=${res.status}, code=${rejectedCode})`);
    return { ok: false, failure: failureOfCode(rejectedCode), code: rejectedCode };
  }
  if (!res.ok || !json?.response) {
    console.warn(`[${label}] 응답을 읽지 못했다 (status=${res.status})`);
    return { ok: false, failure: "unavailable", code: String(res.status) };
  }

  const { header, body: payload } = json.response;
  if (!OK_CODES.has(header.resultCode)) {
    console.warn(`[${label}] 결과 코드 ${header.resultCode}`);
    return { ok: false, failure: failureOfCode(header.resultCode), code: header.resultCode };
  }

  const items = payload?.items ? payload.items.item : [];
  return { ok: true, value: Array.isArray(items) ? items : [items] };
}

function tryParse<T>(body: string): T | undefined {
  try {
    return JSON.parse(body);
  } catch {
    return undefined; // 키 오류는 _type=json 이어도 XML 로 올 때가 있다.
  }
}
