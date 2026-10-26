"use client";

import { useMemo, useState } from "react";
import { KakaoMap, type MapPin } from "./kakao-map";

export type MapDay = {
  dayNumber: number;
  dateLabel: string;
  tone: MapPin["tone"];
  stops: { id: string; lat: number; lng: number; title: string; timeLabel: string }[];
};

const TAB_BG: Record<MapPin["tone"], string> = {
  yellow: "bg-yellow",
  mint: "bg-mint",
  coral: "bg-coral",
  lavender: "bg-lavender",
  ink: "bg-ink text-cream",
};

/**
 * 일정 지도 — 하루씩 본다. 그날 장소만 1, 2, 3… 으로 찍고 그날 동선만 잇는다.
 * 이름은 지도 옆 목록에서 같은 번호로 읽는다(지도 위 이름표는 겹쳐서 못 읽는다).
 */
export function ItineraryMap({ days, regionName }: { days: MapDay[]; regionName: string }) {
  const [selected, setSelected] = useState(days[0]?.dayNumber ?? 1);
  const day = days.find((d) => d.dayNumber === selected) ?? days[0]!;

  const pins = useMemo<MapPin[]>(
    () => day.stops.map((s, i) => ({ id: s.id, lat: s.lat, lng: s.lng, badge: String(i + 1), label: s.title, tone: day.tone })),
    [day],
  );
  const routes = useMemo(() => [{ tone: day.tone, points: day.stops.map(({ lat, lng }) => ({ lat, lng })) }], [day]);

  return (
    <section aria-labelledby="map-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="map-title" className="font-display text-[26px]">
          동선 한눈에 보기
        </h2>
        <div role="tablist" aria-label="일차" className="flex gap-2">
          {days.map((d) => {
            const active = d.dayNumber === day.dayNumber;
            return (
              <button
                key={d.dayNumber}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelected(d.dayNumber)}
                className={`h-11 rounded-full border-[2.5px] border-ink px-4 font-display text-[17px] transition-transform ${
                  active ? `-rotate-2 shadow-pop-sm ${TAB_BG[d.tone]}` : "bg-surface hover:-translate-y-0.5"
                }`}
              >
                {d.dayNumber}일차
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_340px]">
        <KakaoMap pins={pins} routes={routes} label={`${regionName} ${day.dayNumber}일차 동선 지도`} />
        <ol aria-label={`${day.dayNumber}일차 장소`} className="space-y-2 self-start">
          {day.stops.map((s, i) => (
            <li key={s.id} className="flex items-start gap-3 rounded-2xl border-[2.5px] border-ink bg-surface px-3 py-2.5">
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink font-display ${TAB_BG[day.tone]}`}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-muted">{s.timeLabel}</span>
                {/* 이름은 자르지 않는다 — 지도 번호와 짝을 맞추려면 끝까지 읽혀야 한다 */}
                <span className="block font-bold leading-snug [overflow-wrap:anywhere]">{s.title}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-3 text-sm text-muted">선은 장소를 순서대로 이은 것이라 실제 길과 달라요.</p>
    </section>
  );
}
