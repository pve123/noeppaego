import { Coordinate } from "@/shared/kernel/coordinate";
import { TravelWindow } from "@/shared/kernel/travel-window";

/** 시·군·구 단위 지역 — 코드는 법정동 시·도 + 시·군·구(`41-480`) */
export type Region = {
  readonly code: string;
  readonly name: string;
};

export type Festival = {
  readonly id: string;
  readonly title: string;
  /** YYYY-MM-DD */
  readonly start: string;
  readonly end: string;
  readonly location: Coordinate;
  readonly region: Region;
  readonly address: string;
  readonly imageUrl?: string;
};

/** 포트 — 기간과 겹치는 축제·행사 */
export interface FestivalRepository {
  findOverlapping(window: TravelWindow): Promise<Festival[]>;
}
