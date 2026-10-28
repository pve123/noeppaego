import "server-only";
import { cacheLife } from "next/cache";
import { requestItems, type PublicDataResult } from "@/shared/public-data/public-data";

/**
 * 한국관광공사 국문 관광정보(KorService2). https://www.data.go.kr/data/15101578/openapi.do
 * 여러 컨텍스트(destination·itinerary)가 같이 쓰는 바깥 서버 클라이언트.
 */
const BASE = "https://apis.data.go.kr/B551011/KorService2";
const COMMON = { MobileOS: "ETC", MobileApp: "holidayTrip" };

/** 관광 타입(contentTypeId) */
export const ContentType = {
  sight: "12",
  culture: "14",
  festival: "15",
  lodging: "32",
  restaurant: "39",
} as const;
export type ContentTypeId = (typeof ContentType)[keyof typeof ContentType];

/** 목록 항목 중 쓰는 것만 */
export type TourItem = {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  mapx: string;
  mapy: string;
  firstimage: string;
  /** 법정동 시·도 코드 */
  lDongRegnCd: string;
  /** 법정동 시·군·구 코드 */
  lDongSignguCd: string;
  /** 신분류 소분류(예: 카페 FD050100) */
  lclsSystm3?: string;
};

export type FestivalItem = TourItem & {
  /** YYYYMMDD */
  eventstartdate: string;
  eventenddate: string;
};

/**
 * [start, end] 와 겹치는 행사. 날짜는 YYYYMMDD.
 * 관광 정보는 하루에도 고쳐질 수 있어 몇 시간만 캐시한다. 실패는 몇 초만.
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

/** 한 지역(법정동 시·도 + 시·군·구)의 장소 — 사진 있는 것부터(arrange=Q) */
export async function fetchAreaItems(
  regionCode: string,
  type: ContentTypeId,
  rows: number,
): Promise<PublicDataResult<TourItem[]>> {
  "use cache";
  const [regn, signgu] = regionCode.split("-");
  const result = await requestItems<TourItem>("tour:area", `${BASE}/areaBasedList2`, {
    ...COMMON,
    lDongRegnCd: regn,
    ...(signgu ? { lDongSignguCd: signgu } : {}),
    contentTypeId: type,
    arrange: "Q",
    numOfRows: String(rows),
    pageNo: "1",
  });
  if (result.ok) cacheLife("hours");
  else cacheLife("seconds");
  return result;
}

/** 좌표 반경(m) 안의 장소 — 가까운 순(arrange=E) */
export async function fetchNearbyItems(
  lat: number,
  lng: number,
  radiusM: number,
  type: ContentTypeId,
  rows: number,
): Promise<PublicDataResult<TourItem[]>> {
  "use cache";
  const result = await requestItems<TourItem>("tour:nearby", `${BASE}/locationBasedList2`, {
    ...COMMON,
    mapX: String(lng),
    mapY: String(lat),
    radius: String(radiusM),
    contentTypeId: type,
    arrange: "E",
    numOfRows: String(rows),
    pageNo: "1",
  });
  if (result.ok) cacheLife("hours");
  else cacheLife("seconds");
  return result;
}

/** 장소 소개(overview) — 거의 안 바뀌어 며칠 캐시한다. 소개가 비었으면 빈 문자열 */
export async function fetchOverview(contentId: string): Promise<PublicDataResult<string>> {
  "use cache";
  const result = await requestItems<{ overview?: string }>("tour:overview", `${BASE}/detailCommon2`, { ...COMMON, contentId });
  if (!result.ok) {
    cacheLife("seconds");
    return result;
  }
  cacheLife("days");
  return { ok: true, value: result.value[0]?.overview ?? "" };
}

/** 소개 정보(detailIntro2) 중 주차 칸 — 타입마다 이름이 다르다. 값에 `<br>` 같은 태그가 섞여 온다 */
type IntroParking = { parking?: string; parkingculture?: string; parkingfee?: string; parkinglodging?: string };

/** 시설 주차 안내 — 관광지·문화시설·숙소만 칸이 있다. 거의 안 바뀌어 며칠 캐시한다. 없으면 빈 값 */
export async function fetchIntroParking(
  contentId: string,
  contentTypeId: ContentTypeId,
): Promise<PublicDataResult<{ parking: string; fee: string }>> {
  "use cache";
  const result = await requestItems<IntroParking>("tour:intro", `${BASE}/detailIntro2`, { ...COMMON, contentId, contentTypeId });
  if (!result.ok) {
    cacheLife("seconds");
    return result;
  }
  cacheLife("days");
  const item = result.value[0] ?? {};
  return { ok: true, value: { parking: item.parking ?? item.parkingculture ?? item.parkinglodging ?? "", fee: item.parkingfee ?? "" } };
}

// ── 항목 해석 ─────────────────────────────────────────

/** 세종은 시·군·구가 없어 시·도 코드 하나로 온다 */
const SINGLE_TIER_REGIONS = new Set(["36110"]);

/** 시·군·구 지역 코드(`41-480`)와 이름(「경기도 파주시」). 지역 코드가 없으면 undefined. */
export function regionOf(item: TourItem): { code: string; name: string } | undefined {
  if (!item.lDongRegnCd) return undefined;
  const single = SINGLE_TIER_REGIONS.has(item.lDongRegnCd);
  // 지역 이름은 주소 앞부분 — 코드표를 따로 묻지 않는다.
  const words = item.addr1.trim().split(/\s+/);
  return {
    code: single ? item.lDongRegnCd : `${item.lDongRegnCd}-${item.lDongSignguCd}`,
    name: words.slice(0, single ? 1 : 2).join(" "),
  };
}

/** 위경도 — 좌표가 비었으면 undefined */
export function latLngOf(item: TourItem): { lat: number; lng: number } | undefined {
  const lat = Number(item.mapy);
  const lng = Number(item.mapx);
  return lat && lng ? { lat, lng } : undefined;
}

/** YYYYMMDD → YYYY-MM-DD. 형식이 아니면 undefined */
export function isoOf(ymd: string): string | undefined {
  return /^\d{8}$/.test(ymd) ? `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}` : undefined;
}
