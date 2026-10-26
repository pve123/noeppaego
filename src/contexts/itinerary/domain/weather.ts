import { Coordinate } from "@/shared/kernel/coordinate";

/** 오전 또는 오후 날씨 */
export type HalfDay = {
  /** 강수확률(%) */
  readonly rainChance: number;
  /** 「맑음」「구름많음」「흐리고 비」 */
  readonly sky: string;
};

export type DayWeather = {
  readonly date: string;
  readonly am?: HalfDay;
  readonly pm?: HalfDay;
  readonly tempMin?: number;
  readonly tempMax?: number;
};

/** 강수확률이 이 이상이면 비 오는 반나절로 본다 */
export const WET_CHANCE = 60;

export function isWet(half: HalfDay | undefined): boolean {
  if (!half) return false;
  return half.rainChance >= WET_CHANCE || /비|눈|소나기/.test(half.sky);
}

/** 포트 — 예보가 있는 날만 담는다(10일 넘게 남은 날은 없다) */
export interface WeatherOutlook {
  forecast(at: Coordinate, regionCode: string, dates: readonly string[], today: string): Promise<Map<string, DayWeather>>;
}
