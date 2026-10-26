/**
 * 기상청 동네예보 격자(Lambert 정각원추도법, 5km) — 기상청이 공개한 변환식 그대로.
 * 순수 함수라 서버 밖(테스트)에서도 쓴다.
 */
const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0; // 격자 간격(km)
const SLAT1 = 30.0;
const SLAT2 = 60.0;
const OLON = 126.0; // 기준점 경도
const OLAT = 38.0; // 기준점 위도
const XO = 43; // 기준점 X
const YO = 136; // 기준점 Y

export function toGrid(lat: number, lng: number): { nx: number; ny: number } {
  const DEGRAD = Math.PI / 180;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

/** 영동·영서를 가르는 경도 — 대관령 부근 */
const GANGWON_EAST_LNG = 128.6;

/**
 * 중기 육상예보 권역 코드. 법정동 시·도 코드로 고르고, 강원은 영동·영서를 경도로 가른다.
 * 모르는 시·도면 undefined.
 */
export function midLandRegionOf(sidoCode: string, lng: number): string | undefined {
  switch (sidoCode) {
    case "11": // 서울
    case "28": // 인천
    case "41": // 경기
      return "11B00000";
    case "51": // 강원
    case "42":
      return lng >= GANGWON_EAST_LNG ? "11D20000" : "11D10000";
    case "30": // 대전
    case "36110": // 세종
    case "44": // 충남
      return "11C20000";
    case "43": // 충북
      return "11C10000";
    case "12": // 전남광주통합특별시
    case "29": // 광주
    case "46": // 전남
      return "11F20000";
    case "52": // 전북
    case "45":
      return "11F10000";
    case "27": // 대구
    case "47": // 경북
      return "11H10000";
    case "26": // 부산
    case "31": // 울산
    case "48": // 경남
      return "11H20000";
    case "50": // 제주
      return "11G00000";
    default:
      return undefined;
  }
}
