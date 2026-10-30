"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CrosshairIcon, PinIcon } from "./icons";

/**
 * 출발지 고르기 — 버튼을 누르면 도시 칩이 그 자리에서 펼쳐진다(아래 카드를 덮지 않고 밀어낸다).
 * 고르면 접히고 바로 다시 찾는다(주소에 ?from= 으로 남아 공유된다). 접혀 있을 땐 inert 라 Tab·화면 낭독기에서 빠진다.
 * 옆의 「내 위치로」는 한 번에 휴대폰 위치를 약 1km 단위(소수 둘째 자리)로 줄여 `?from=here:위도,경도` 로 넘긴다 — 서버에 저장하지 않는다.
 * @param query 주소에 함께 남길 다른 값(예: `&reach=near`) — 출발지를 바꿔도 거리 선택을 지킨다
 */
export function OriginSelect({
  origins,
  selected,
  selectedName,
  basePath,
  query = "",
}: {
  origins: { id: string; name: string }[];
  selected: string;
  /** 지금 출발지 이름 — 내 위치면 「종로구 근처」처럼 서버가 붙인 이름 */
  selectedName: string;
  basePath: string;
  query?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const isHere = selected.startsWith("here:");
  /** 위치를 찾는 중이거나 못 찾은 까닭 */
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string>();

  const pick = (originId: string) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (originId === selected) return;
    startTransition(() => router.push(`${basePath}?from=${originId}${query}`, { scroll: false }));
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setLocateError("이 기기에서는 위치를 쓸 수 없어요. 도시를 골라 주세요.");
      return;
    }
    setLocating(true);
    setLocateError(undefined);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        pick(`here:${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`);
      },
      (e) => {
        setLocating(false);
        setLocateError(
          e.code === e.PERMISSION_DENIED
            ? "위치 권한을 허용하면 쓸 수 있어요. 도시를 골라도 돼요."
            : "위치를 찾지 못했어요. 잠시 뒤 다시 해 보거나 도시를 골라 주세요.",
        );
      },
      // 도시 단위 거리 계산이라 정밀할 필요가 없다 — 빠르고 배터리를 덜 쓰는 쪽으로
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  };

  return (
    <div
      className="w-full"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span id={`${id}-label`} className="font-bold sm:w-40">
          어디서 출발하세요?
        </span>
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          aria-labelledby={`${id}-label ${id}-button`}
          id={`${id}-button`}
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex h-11 items-center gap-2 rounded-full border-[2.5px] border-ink pl-3 pr-3.5 font-display text-[17px] transition-all hover:-translate-y-0.5 ${
            open ? "bg-yellow shadow-pop-sm" : "bg-surface"
          } ${pending ? "opacity-60" : ""}`}
        >
          {isHere ? <CrosshairIcon className="size-4" /> : <PinIcon className="size-4" />}
          {selectedName}
          <svg viewBox="0 0 12 8" aria-hidden className={`ml-1 w-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
            <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {/* 도시 목록을 열지 않고 한 번에 — 휴대폰에서 가장 빠른 길 */}
        {!isHere && (
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className={`inline-flex h-11 items-center gap-1.5 rounded-full border-[2.5px] border-dashed border-ink/40 bg-surface/60 px-3.5 font-display text-[16px] transition-all hover:-translate-y-0.5 hover:border-solid hover:border-ink hover:bg-mint ${
              locating ? "animate-pulse" : ""
            }`}
          >
            <CrosshairIcon className="size-4" />
            {locating ? "위치 찾는 중…" : "내 위치로"}
          </button>
        )}
      </div>
      {locateError && (
        <p role="alert" className="mt-2 text-sm font-bold text-coral sm:ml-[172px]">
          {locateError}
        </p>
      )}

      {/* 높이 0 → 내용 높이로 부드럽게 — grid-template-rows 0fr ↔ 1fr */}
      <div
        id={`${id}-panel`}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          {/* 휴대폰: 한 줄로 밀어 보고 오른쪽 끝을 흐려 「더 있어요」를 보인다(일정 카드 바꾸기 칩과 같은 모양).
              넓은 화면: 9칸 격자로 두 줄을 고르게 — 마지막 줄에 한두 개만 남지 않게 */}
          <ul
            aria-label="출발지"
            className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1 pr-12 pt-3 [mask-image:linear-gradient(to_right,#000_calc(100%-40px),transparent)] sm:grid sm:grid-cols-[repeat(9,minmax(0,1fr))] sm:overflow-visible sm:pr-0 sm:[mask-image:none]"
          >
            {origins.map((o) => {
              const isSelected = o.id === selected;
              return (
                <li key={o.id} className="shrink-0 snap-start">
                  <button
                    type="button"
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() => pick(o.id)}
                    className={`inline-flex h-10 w-full items-center justify-center gap-1 rounded-full border-2 px-4 font-display text-[16px] transition-colors ${
                      isSelected ? "border-ink bg-mint" : "border-ink/20 bg-surface hover:border-ink hover:bg-yellow"
                    }`}
                  >
                    {o.name}
                    {isSelected && <span aria-hidden>✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
