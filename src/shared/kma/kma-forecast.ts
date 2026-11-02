/**
 * 기상청 예보 응답 해석(순수 함수) — 시간별 단기예보를 반나절로, 중기예보를 날짜로.
 */
export type ShortItem = { category: string; fcstDate: string; fcstTime: string; fcstValue: string };
export type MidLandItem = Record<string, string | number>;
type HalfDayForecast = { rainChance: number; sky: string };

const PTY: Record<string, string> = { "1": "비", "2": "비나 눈", "3": "눈", "4": "소나기" };
const SKY: Record<string, string> = { "1": "맑음", "3": "구름많음", "4": "흐림" };

/**
 * 시간별 예보를 반나절로 — 강수확률은 가장 높은 값, 하늘은 가장 많은 상태, 비·눈은 하나라도 있으면.
 * @param date YYYYMMDD
 * @param from·to HHmm(양 끝 포함)
 * @returns 그 시간대 예보가 없으면(이미 지났으면) undefined
 */
export function shortHalfDay(items: ShortItem[], date: string, from: string, to: string): HalfDayForecast | undefined {
  const inRange = items.filter((i) => i.fcstDate === date && i.fcstTime >= from && i.fcstTime <= to);
  const values = (category: string) => inRange.filter((i) => i.category === category).map((i) => i.fcstValue);
  const pops = values("POP").map(Number);
  if (pops.length === 0) return undefined;

  const pty = values("PTY").find((v) => v !== "0");
  const skies = values("SKY");
  const count = (v: string) => skies.filter((s) => s === v).length;
  const sky = [...new Set(skies)].sort((a, b) => count(b) - count(a))[0];
  return {
    rainChance: Math.max(...pops),
    sky: pty ? (sky === "4" ? `흐리고 ${PTY[pty]}` : PTY[pty]) : (SKY[sky] ?? "구름많음"),
  };
}

/** 그날 최저(TMN)·최고(TMX) 기온 */
export function shortTemps(items: ShortItem[], date: string): { min?: number; max?: number } {
  const temp = (category: string) => {
    const v = items.find((i) => i.fcstDate === date && i.category === category)?.fcstValue;
    return v === undefined ? undefined : Math.round(Number(v));
  };
  return { min: temp("TMN"), max: temp("TMX") };
}

/**
 * 중기예보 n일 뒤 오전·오후. 8일 뒤부터는 하루 하나(rnSt8·wf8)라 오전·오후에 같은 값을 쓴다.
 */
export function midHalfDays(item: MidLandItem, n: number): { am?: HalfDayForecast; pm?: HalfDayForecast } {
  const half = (suffix: string): HalfDayForecast | undefined => {
    const rain = item[`rnSt${n}${suffix}`];
    const sky = item[`wf${n}${suffix}`];
    return rain === undefined || sky === undefined ? undefined : { rainChance: Number(rain), sky: String(sky) };
  };
  return { am: half("Am") ?? half(""), pm: half("Pm") ?? half("") };
}

// ── 발표 시각 ─────────────────────────────────────────

const SHORT_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23];
/** 발표 뒤 API 에 올라오기까지 여유 */
const PUBLISH_DELAY_MIN = 15;

const kst = (now: Date) => new Date(now.getTime() + 9 * 3_600_000);
const ymdOf = (d: Date) => d.toISOString().slice(0, 10).replaceAll("-", "");

/** 지금 받을 수 있는 가장 최근 단기예보 발표(KST) */
export function latestShortBase(now: Date): { baseDate: string; baseTime: string } {
  const t = kst(now);
  const minutes = t.getUTCHours() * 60 + t.getUTCMinutes();
  const hour = [...SHORT_BASE_HOURS].reverse().find((h) => h * 60 + PUBLISH_DELAY_MIN <= minutes);
  if (hour === undefined) {
    const yesterday = new Date(t.getTime() - 86_400_000);
    return { baseDate: ymdOf(yesterday), baseTime: "2300" };
  }
  return { baseDate: ymdOf(t), baseTime: `${String(hour).padStart(2, "0")}00` };
}

/** 지금 받을 수 있는 가장 최근 중기예보 발표(06시·18시, KST) — `YYYYMMDDHHmm` */
export function latestMidBase(now: Date): string {
  const t = kst(now);
  const minutes = t.getUTCHours() * 60 + t.getUTCMinutes();
  if (minutes >= 18 * 60 + PUBLISH_DELAY_MIN * 2) return `${ymdOf(t)}1800`;
  if (minutes >= 6 * 60 + PUBLISH_DELAY_MIN * 2) return `${ymdOf(t)}0600`;
  return `${ymdOf(new Date(t.getTime() - 86_400_000))}1800`;
}
