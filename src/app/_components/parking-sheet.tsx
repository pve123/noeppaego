"use client";

import { useRef, useState } from "react";
import type { FacilityParkingView, ParkingView } from "@/contexts/itinerary";
import { Sheet } from "./sheet";
import { fetchFacilityParking, fetchParking, hasFacilityParking } from "./parking-client";
import { useRouteChooser } from "./route-sheet";

type Lots = "loading" | "failed" | ParkingView[];

/** 주차 표지판 색 — 글을 읽지 않아도 알아본다 */
export function ParkingMark({ className = "size-4 text-[10px]" }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-[4px] bg-[#1d5fd6] font-black leading-none text-white ${className}`}>
      P
    </span>
  );
}

/**
 * 주소 줄의 「주차」 칩 — 누르면 근처 주차장 시트(휴대폰은 아래에서 올라오고, 넓은 화면은 가운데)를 연다.
 * 목록은 처음 열 때만 불러온다(아무도 안 누르면 카카오를 부르지 않는다).
 * 핵심은 「길찾기」 — 장소 대신 주차장으로 바로 내비를 찍는다.
 */
export function ParkingChip({
  place,
  pill,
}: {
  place: { id: string; kind?: string; title: string; lat: number; lng: number; url?: string };
  pill: string;
}) {
  const { title: placeName, lat, lng } = place;
  const dialog = useRef<HTMLDialogElement>(null);
  const [lots, setLots] = useState<Lots>();
  /** 시설 자체 주차 안내(관광공사) — 없거나 아직 모르면 null */
  const [facility, setFacility] = useState<FacilityParkingView | null>(null);
  const route = useRouteChooser();

  const load = async () => {
    setLots("loading");
    if (hasFacilityParking(place.id, place.kind)) void fetchFacilityParking(place.id, place.kind!).then(setFacility);
    try {
      setLots(await fetchParking(lat, lng));
    } catch {
      setLots("failed");
    }
  };

  const open = () => {
    dialog.current?.showModal();
    if (lots === undefined || lots === "failed") void load();
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={`${placeName} 근처 주차장 보기`}
        className={`${pill} sm:gap-1 border-ink/25 bg-surface text-ink/75 hover:border-ink/30 hover:text-ink`}
      >
        <ParkingMark />
        {/* 휴대폰은 P 만 — 주소 자리를 넓힌다 */}
        <span className="hidden sm:inline">주차</span>
      </button>

      <Sheet
        dialogRef={dialog}
        titleId={`parking-${lat}-${lng}`}
        title={
          <>
            <ParkingMark className="size-6 text-[14px]" />
            <span className="truncate">근처 주차장</span>
          </>
        }
      >
          <p className="truncate text-sm text-muted">{placeName}에서 가까운 순이에요.</p>

          {/* 장소 자체 주차 — 근처 주차장과 출처가 달라 따로 둔다 */}
          {facility && (
            <div className="mt-4 rounded-2xl border border-[#1d5fd6]/20 bg-[#1d5fd6]/5 px-4 py-3">
              <p className="text-[13px] font-bold text-[#1d5fd6]">{place.kind === "festival" ? "축제 주차" : "이 장소 주차"}</p>
              <p className="mt-0.5 text-[15px] leading-snug">{facility.text}</p>
              {facility.fee && <p className="mt-0.5 text-[13px] text-muted">요금: {facility.fee}</p>}
              {facility.homepage && <OutLink href={facility.homepage}>축제 홈페이지에서 확인하기</OutLink>}
              {!facility.general && <p className="mt-1 text-[12px] text-muted">한국관광공사 안내예요.</p>}
            </div>
          )}
          {/* 카카오 가게는 API 에 주차 정보가 없다 — 카카오맵 장소 화면(주차 가능 여부가 보통 있다)으로 보낸다 */}
          {!facility && place.id.startsWith("kakao:") && place.url && (
            <div className="mt-4 rounded-2xl border border-[#1d5fd6]/20 bg-[#1d5fd6]/5 px-4 py-3">
              <p className="text-[13px] font-bold text-[#1d5fd6]">이 가게 주차</p>
              <p className="mt-0.5 text-[15px] leading-snug">가게 주차 정보는 카카오맵에서 확인해 주세요.</p>
              <OutLink href={place.url}>카카오맵에서 보기</OutLink>
            </div>
          )}

          <div className="mt-4" aria-live="polite" aria-busy={lots === "loading"}>
            {lots === "loading" && (
              <ul className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="shimmer h-[68px] rounded-2xl" />
                ))}
              </ul>
            )}
            {lots === "failed" && (
              <p className="rounded-2xl bg-surface px-4 py-5 text-center text-[15px]">
                주차장을 불러오지 못했어요.{" "}
                <button type="button" onClick={load} className="font-bold underline underline-offset-4">
                  다시 시도
                </button>
              </p>
            )}
            {Array.isArray(lots) && lots.length === 0 && (
              <p className="rounded-2xl bg-surface px-4 py-5 text-center text-[15px]">걸어서 갈 만한 거리(500m)에 주차장이 없어요.</p>
            )}
            {Array.isArray(lots) && lots.length > 0 && (
              <ul className="space-y-2">
                {lots.map((lot) => (
                  <li key={`${lot.name}-${lot.lat}`} className="flex items-center gap-3 rounded-2xl border-2 border-ink/15 bg-surface py-3 pl-4 pr-3">
                    {/* 세 줄 — 이름, 걷는 시간, 주소. 줄마다 넘치면 … (길찾기 버튼을 줄여 이름 자리를 넓혔다) */}
                    <div className="min-w-0 flex-1">
                      <p title={lot.name} className="truncate font-bold">
                        {lot.name}
                      </p>
                      <p className="mt-0.5 text-[13px] font-bold text-ink/80">걸어서 {lot.walkMinutes}분</p>
                      <p title={lot.address} className="truncate text-[13px] text-muted">
                        {lot.address}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => route.open({ name: lot.name, lat: lot.lat, lng: lot.lng })}
                      aria-label={`${lot.name}로 길찾기`}
                      className="inline-flex h-11 shrink-0 items-center rounded-full border border-ink/15 bg-yellow px-3.5 font-display text-[15px]"
                    >
                      길찾기
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-3 text-[13px] text-muted">요금과 빈자리는 현장에서 확인해 주세요.</p>
      </Sheet>
      {route.sheet}
    </>
  );
}

/** 앱 밖으로 나가는 링크 — 새 창, ↗ 로 밖이라는 걸 알린다 */
function OutLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex h-9 items-center gap-1 rounded-full border border-ink/15 bg-surface px-3 text-sm font-bold hover:bg-yellow"
    >
      {children} <span aria-hidden>↗</span>
    </a>
  );
}
