import "server-only";
import { Coordinate } from "@/shared/kernel/coordinate";
import { TravelWindow } from "@/shared/kernel/travel-window";
import { midLandRegionOf, toGrid } from "@/shared/kma/kma-grid";
import { fetchMidLand, fetchShortTerm } from "@/shared/kma/kma";
import { latestMidBase, latestShortBase, midHalfDays, shortHalfDay, shortTemps } from "@/shared/kma/kma-forecast";
import { DayWeather, WeatherOutlook } from "../domain/weather";

/** 단기예보가 덮는 날(오늘 포함 +3일까지), 중기예보가 덮는 날(+4~+10일) */
const SHORT_DAYS = 3;
const MID_DAYS = 10;

/**
 * 기상청 예보로 날씨를 채운다. 예보가 없거나 실패한 날은 비워 둔다 — 날씨 없이도 일정은 짠다.
 * 실패는 kma 클라이언트가 warn 으로 남겼다.
 */
export class KmaWeatherOutlook implements WeatherOutlook {
  async forecast(
    at: Coordinate,
    regionCode: string,
    dates: readonly string[],
    today: string,
  ): Promise<Map<string, DayWeather>> {
    const ahead = (date: string) => (date < today ? -1 : TravelWindow.of(today, date).days - 1);
    const shortDates = dates.filter((d) => ahead(d) >= 0 && ahead(d) <= SHORT_DAYS);
    const midDates = dates.filter((d) => ahead(d) > SHORT_DAYS && ahead(d) <= MID_DAYS);
    const now = new Date();

    const [short, mid] = await Promise.all([
      shortDates.length > 0 ? this.short(at, shortDates, now) : [],
      midDates.length > 0 ? this.mid(at, regionCode, midDates, now) : [],
    ]);
    return new Map([...short, ...mid].map((w) => [w.date, w]));
  }

  private async short(at: Coordinate, dates: string[], now: Date): Promise<DayWeather[]> {
    const { nx, ny } = toGrid(at.lat, at.lng);
    const { baseDate, baseTime } = latestShortBase(now);
    const result = await fetchShortTerm(nx, ny, baseDate, baseTime);
    if (!result.ok) return [];

    return dates.map((date) => {
      const ymd = date.replaceAll("-", "");
      const temps = shortTemps(result.value, ymd);
      return {
        date,
        am: shortHalfDay(result.value, ymd, "0600", "1100"),
        pm: shortHalfDay(result.value, ymd, "1200", "1800"),
        tempMin: temps.min,
        tempMax: temps.max,
      };
    });
  }

  private async mid(at: Coordinate, regionCode: string, dates: string[], now: Date): Promise<DayWeather[]> {
    const regId = midLandRegionOf(regionCode.split("-")[0], at.lng);
    if (!regId) return [];
    const tmFc = latestMidBase(now);
    const result = await fetchMidLand(regId, tmFc);
    const item = result.ok ? result.value[0] : undefined;
    if (!item) return [];

    const announced = `${tmFc.slice(0, 4)}-${tmFc.slice(4, 6)}-${tmFc.slice(6, 8)}`;
    return dates.flatMap((date) => {
      const { am, pm } = midHalfDays(item, TravelWindow.of(announced, date).days - 1); // 발표일 기준 n일 뒤
      return am || pm ? [{ date, am, pm }] : [];
    });
  }
}
