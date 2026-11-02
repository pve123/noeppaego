import "server-only";
import { cacheFor } from "@/shared/cache";
import { requestItems, type PublicDataResult } from "@/shared/public-data/public-data";

/** 한국천문연구원 특일 정보 — 공휴일(getRestDeInfo). https://www.data.go.kr/data/15012690/openapi.do */
const ENDPOINT =
  "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

type RestDay = { date: string; name: string };

type SpcdeItem = { locdate: number; dateName: string; isHoliday: "Y" | "N" };

/**
 * 한 해의 공휴일(대체공휴일·임시공휴일 포함). 성공은 하루 캐시한다 — 개발 계정 한도가 하루 1만 건이다.
 * 실패는 몇 초만 캐시해 키를 고치면 바로 다시 묻는다.
 */
export async function fetchRestDays(year: number): Promise<PublicDataResult<RestDay[]>> {
  "use cache";

  const result = await requestItems<SpcdeItem>("holiday", ENDPOINT, {
    solYear: String(year),
    numOfRows: "100",
  });
  cacheFor(result.ok, "days");
  if (!result.ok) return result;
  return { ok: true, value: result.value.filter((item) => item.isHoliday === "Y").map(toRestDay) };
}

function toRestDay(item: SpcdeItem): RestDay {
  const d = String(item.locdate);
  return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, name: item.dateName };
}
