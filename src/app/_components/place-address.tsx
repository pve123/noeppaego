"use client";

import { useState } from "react";
import { ParkingChip } from "./parking-sheet";
import { PinIcon } from "./icons";

/**
 * 카드 아래 주소 줄 — 📍 주소(한 줄, 넘치면 … · 누르면 전체) · 복사 · 지도 · 주차(좌표가 있을 때).
 * 휴대폰에서는 버튼을 아이콘만 남겨 주소가 한 줄에 더 많이 보이게 한다(읽는 이름은 aria-label).
 * 주소는 읽기보다 내비·지도 앱에 넘기려고 찾는다. 지도는 주소로 카카오맵 검색을 연다(키 없이 된다).
 * 복사가 막힌 브라우저에서는 직접 복사하도록 창을 띄운다(링크 복사 버튼과 같은 방식).
 */
export function AddressBar({
  address,
  place,
}: {
  address: string;
  place?: { id: string; kind?: string; title: string; lat: number; lng: number };
}) {
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);
  // 휴대폰은 아이콘만 들어가는 동그라미(누르는 자리는 32px), 넓은 화면은 글자 알약
  const pill =
    "inline-flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[12px] font-bold transition-colors sm:h-7 sm:w-auto sm:px-2.5";
  return (
    <div className={`flex gap-2 border-t-2 border-dashed border-ink/15 px-3 py-2 sm:px-4 ${full ? "items-start" : "items-center"}`}>
      <PinIcon className={`size-4 shrink-0 text-coral ${full ? "mt-1" : ""}`} />
      {/* 휴대폰엔 마우스 올림이 없어 잘린 주소를 누르면 전체로 편다 */}
      <button
        type="button"
        onClick={() => setFull((v) => !v)}
        aria-expanded={full}
        title={address}
        className={`min-w-0 flex-1 py-1 text-left text-[13px] leading-snug text-muted ${full ? "[overflow-wrap:anywhere]" : "truncate"}`}
      >
        <span className="sr-only">주소 </span>
        {address}
      </button>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            prompt("이 주소를 복사해 주세요", address);
          }
        }}
        aria-label={copied ? "주소를 복사했어요" : "주소 복사"}
        className={`${pill} ${copied ? "border-ink bg-mint text-ink" : "border-ink/25 bg-surface text-ink/75 hover:border-ink hover:text-ink"}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-4 sm:hidden" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {copied ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" /></>}
        </svg>
        <span className="hidden sm:inline">{copied ? "복사했어요 ✓" : "복사"}</span>
      </button>
      <a
        href={`https://map.kakao.com/link/search/${encodeURIComponent(address)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="카카오맵에서 이 주소 보기"
        className={`${pill} border-ink/25 bg-surface text-ink/75 hover:border-ink hover:text-ink`}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-4 sm:hidden" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4zM9 4v14M15 6v14" />
        </svg>
        <span className="hidden sm:inline">
          지도 <span aria-hidden className="ml-0.5">↗</span>
        </span>
      </a>
      {/* 칸의 장소를 바꾸면 좌표가 바뀐다 — key 로 새로 만들어 앞 장소의 주차장 목록이 남지 않게 */}
      {place && <ParkingChip key={`${place.id},${place.lat},${place.lng}`} place={place} pill={pill} />}
    </div>
  );
}
