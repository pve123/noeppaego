"use client";

import { useMemo, useState } from "react";
import { KakaoMap, type MapPin } from "./kakao-map";
import { fetchParking, parkingRouteUrl } from "./parking-client";
import { ParkingMark } from "./parking-sheet";

export type MapDay = {
  dayNumber: number;
  dateLabel: string;
  tone: MapPin["tone"];
  stops: { id: string; lat: number; lng: number; title: string; timeLabel: string }[];
};

/** 안내 칩의 선 색 — 그날 동선 선과 같은 색 */
const TONE_TEXT: Record<MapPin["tone"], string> = {
  yellow: "text-yellow",
  mint: "text-mint",
  coral: "text-coral",
  lavender: "text-lavender",
  ink: "text-ink",
};

const TAB_BG: Record<MapPin["tone"], string> = {
  yellow: "bg-yellow",
  mint: "bg-mint",
  coral: "bg-coral",
  lavender: "bg-lavender",
  ink: "bg-ink text-cream",
};

/** 그날 주차장 핀 — 불러오는 중·실패도 일차마다 따로 */
type DayParking = "loading" | "failed" | MapPin[];

/** 그날 장소마다 근처 주차장을 모아 P 핀으로 — 같은 주차장은 한 번만 */
async function parkingPinsOf(day: MapDay): Promise<MapPin[]> {
  const lots = (await Promise.all(day.stops.map((s) => fetchParking(s.lat, s.lng)))).flat();
  const pins = new Map<string, MapPin>();
  for (const lot of lots) {
    const id = `parking-${lot.name}-${lot.lat}`;
    pins.set(id, {
      id,
      lat: lot.lat,
      lng: lot.lng,
      badge: "P",
      label: `${lot.name} (걸어서 ${lot.walkMinutes}분)`,
      tone: day.tone,
      parking: true,
      link: { href: parkingRouteUrl(lot), text: "길찾기" },
    });
  }
  return [...pins.values()];
}

/**
 * 일정 지도 — 하루씩 본다. 그날 장소만 1, 2, 3… 으로 찍고 그날 동선만 잇는다.
 * 이름은 지도 옆 목록에서 같은 번호로 읽는다(지도 위 이름표는 겹쳐서 못 읽는다).
 * 「주차장 보기」를 켜면 그날 장소 근처 주차장을 작은 파란 P 로 더한다(켤 때·일차를 바꿀 때만 불러온다).
 */
export function ItineraryMap({ days, regionName }: { days: MapDay[]; regionName: string }) {
  const [selected, setSelected] = useState(days[0]?.dayNumber ?? 1);
  const day = days.find((d) => d.dayNumber === selected) ?? days[0]!;
  const [showParking, setShowParking] = useState(false);
  const [parking, setParking] = useState<Record<number, DayParking>>({});
  const dayParking = showParking ? parking[day.dayNumber] : undefined;

  const loadParking = (target: MapDay) => {
    const current = parking[target.dayNumber];
    if (current === "loading" || Array.isArray(current)) return;
    setParking((p) => ({ ...p, [target.dayNumber]: "loading" }));
    parkingPinsOf(target).then(
      (pins) => setParking((p) => ({ ...p, [target.dayNumber]: pins })),
      () => setParking((p) => ({ ...p, [target.dayNumber]: "failed" })),
    );
  };
  const selectDay = (d: MapDay) => {
    setSelected(d.dayNumber);
    if (showParking) loadParking(d);
  };
  const toggleParking = () => {
    if (!showParking) loadParking(day);
    setShowParking((v) => !v);
  };

  const pins = useMemo<MapPin[]>(
    () => [
      ...day.stops.map((s, i) => ({ id: s.id, lat: s.lat, lng: s.lng, badge: String(i + 1), label: s.title, tone: day.tone })),
      ...(Array.isArray(dayParking) ? dayParking : []),
    ],
    [day, dayParking],
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
                onClick={() => selectDay(d)}
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
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          aria-pressed={showParking}
          onClick={toggleParking}
          className={`inline-flex h-10 items-center gap-1.5 rounded-full border-[2.5px] border-ink px-4 text-[15px] font-bold transition-colors ${
            showParking ? "bg-[#1d5fd6] text-white" : "bg-surface hover:bg-cream"
          }`}
        >
          <ParkingMark className={`size-5 text-[12px] ${showParking ? "ring-2 ring-white" : ""}`} />
          주차장 보기
        </button>
        <span aria-live="polite" className="text-sm text-muted">
          {dayParking === "loading" && "근처 주차장을 찾는 중이에요"}
          {dayParking === "failed" && "주차장을 불러오지 못했어요. 다시 켜 보세요."}
          {Array.isArray(dayParking) && dayParking.length === 0 && "이날 장소 근처(500m)에 주차장이 없어요."}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_340px]">
        {/* 선이 길처럼 보여 헷갈리지 않게 — 지도 아래 작은 글 대신 지도 위에 붙여 둔다 */}
        <div className="relative">
          <KakaoMap pins={pins} routes={routes} label={`${regionName} ${day.dayNumber}일차 동선 지도`} />
          {pins.length > 1 && (
            <p className="pointer-events-none absolute left-3 top-3 z-[5] flex items-center gap-2 rounded-full border-2 border-ink bg-surface/95 py-1 pl-2 pr-3 text-[13px] font-bold shadow-pop-sm">
              <svg viewBox="0 0 28 12" aria-hidden className="h-3 w-7 shrink-0">
                <path d="M2 9 L10 3 L18 8 L26 3" fill="none" stroke="#22223b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 9 L10 3 L18 8 L26 3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={TONE_TEXT[day.tone]} />
              </svg>
              방문 순서예요. 실제 길과 달라요.
            </p>
          )}
        </div>
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
    </section>
  );
}
