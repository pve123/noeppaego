/** 하루 일정 줄거리 — 글쓰기에 넘기는 사실만 */
export type DayOutline = {
  readonly dayNumber: number;
  readonly dateLabel: string;
  /** 예보 — 없으면 아직 모르는 날 */
  readonly weather?: string;
  readonly stops: readonly {
    readonly time: string;
    readonly title: string;
    readonly category?: string;
    readonly indoor: boolean;
  }[];
};

/** 포트 — 하루마다 짧은 소개 글. 못 쓰면 undefined(일정은 글 없이도 보여 준다) */
export interface TripWriter {
  describe(regionName: string, days: readonly DayOutline[]): Promise<string[] | undefined>;
}
