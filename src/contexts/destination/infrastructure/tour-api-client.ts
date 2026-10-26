import "server-only";
import { cacheLife } from "next/cache";
import { requestItems, type PublicDataResult } from "@/shared/public-data/public-data";

/** 한국관광공사 국문 관광정보(KorService2). https://www.data.go.kr/data/15101578/openapi.do */
const BASE = "https://apis.data.go.kr/B551011/KorService2";
const COMMON = { MobileOS: "ETC", MobileApp: "holidayTrip" };

/** searchFestival2 의 항목 중 쓰는 것만 */
export type FestivalItem = {
  contentid: string;
  title: string;
  /** YYYYMMDD */
  eventstartdate: string;
  eventenddate: string;
  mapx: string;
  mapy: string;
  addr1: string;
  firstimage: string;
  /** 법정동 시·도 코드 */
  lDongRegnCd: string;
  /** 법정동 시·군·구 코드 */
  lDongSignguCd: string;
};

/**
 * [start, end] 와 겹치는 행사. 날짜는 YYYYMMDD.
 * 행사는 하루에도 고쳐질 수 있어 몇 시간만 캐시한다. 실패는 몇 초만.
 */
export async function fetchFestivals(start: string, end: string): Promise<PublicDataResult<FestivalItem[]>> {
  "use cache";

  const result = await requestItems<FestivalItem>("tour:festival", `${BASE}/searchFestival2`, {
    ...COMMON,
    eventStartDate: start,
    eventEndDate: end,
    numOfRows: "500",
    pageNo: "1",
    arrange: "C",
  });
  if (result.ok) cacheLife("hours");
  else cacheLife("seconds");
  return result;
}
