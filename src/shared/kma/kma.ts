import "server-only";
import { cacheFor } from "@/shared/cache";
import { requestItems, type PublicDataResult } from "@/shared/public-data/public-data";
import type { MidLandItem, ShortItem } from "./kma-forecast";

/**
 * 기상청 단기예보(오늘~+3일, 시간별)·중기 육상예보(+4~+10일, 오전·오후).
 * 발표 시각은 부르는 쪽이 정해 넘긴다 — `use cache` 안에서는 현재 시각을 읽지 않는다.
 */
const BASE = "https://apis.data.go.kr/1360000";

/** 예보는 발표 사이에 바뀌지 않는다 — 같은 발표는 몇 시간 캐시, 실패는 몇 초만. */
export async function fetchShortTerm(
  nx: number,
  ny: number,
  baseDate: string,
  baseTime: string,
): Promise<PublicDataResult<ShortItem[]>> {
  "use cache";
  const result = await requestItems<ShortItem>("kma:short", `${BASE}/VilageFcstInfoService_2.0/getVilageFcst`, {
    dataType: "JSON",
    numOfRows: "1000",
    pageNo: "1",
    base_date: baseDate,
    base_time: baseTime,
    nx: String(nx),
    ny: String(ny),
  });
  cacheFor(result.ok, "hours");
  return result;
}

export async function fetchMidLand(regId: string, tmFc: string): Promise<PublicDataResult<MidLandItem[]>> {
  "use cache";
  const result = await requestItems<MidLandItem>("kma:mid", `${BASE}/MidFcstInfoService/getMidLandFcst`, {
    dataType: "JSON",
    numOfRows: "10",
    pageNo: "1",
    regId,
    tmFc,
  });
  cacheFor(result.ok, "hours");
  return result;
}
