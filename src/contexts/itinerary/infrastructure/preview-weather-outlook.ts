import "server-only";
import { Coordinate } from "@/shared/kernel/coordinate";
import { DayWeather, HalfDay, WeatherOutlook } from "../domain/weather";

const SUNNY: HalfDay = { rainChance: 10, sky: "맑음" };
const CLOUDY: HalfDay = { rainChance: 30, sky: "구름많음" };
const RAIN: HalfDay = { rainChance: 80, sky: "흐리고 비" };
const SHOWER: HalfDay = { rainChance: 60, sky: "구름많고 소나기" };

/** 하루씩 돌아가며 — 맑은 날, 오후에 소나기, 종일 비, 오전만 비 */
const MIXED: [HalfDay, HalfDay][] = [
  [SUNNY, CLOUDY],
  [CLOUDY, SHOWER],
  [RAIN, RAIN],
  [RAIN, CLOUDY],
];

export type WeatherPreview = "rain" | "mixed";

export function weatherPreviewOf(value: string | undefined): WeatherPreview | undefined {
  return value === "rain" || value === "mixed" ? value : undefined;
}

/**
 * 로컬에서 날씨 화면을 보려고 쓰는 가짜 예보 — 기상청을 부르지 않고 연휴 모든 날에 날씨를 채운다.
 * `WEATHER_PREVIEW=rain`(내내 비) · `mixed`(맑음·소나기·비가 섞인다). 조립 루트가 Vercel 에서는 쓰지 않는다.
 */
export class PreviewWeatherOutlook implements WeatherOutlook {
  constructor(private readonly mode: WeatherPreview) {}

  async forecast(_at: Coordinate, _regionCode: string, dates: readonly string[]): Promise<Map<string, DayWeather>> {
    return new Map(
      dates.map((date, i) => {
        const [am, pm] = this.mode === "rain" ? [RAIN, RAIN] : MIXED[i % MIXED.length];
        return [date, { date, am, pm, tempMin: 12 + (i % 3), tempMax: 19 + (i % 4) }];
      }),
    );
  }
}
