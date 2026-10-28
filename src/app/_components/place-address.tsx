"use client";

import { useState } from "react";
import { ParkingChip } from "./parking-sheet";

/**
 * 카드 아래 주소 줄 — 📍 주소(한 줄, 넘치면 … · 누르면 전체) · 복사 · 지도 · 주차(좌표가 있을 때).
 * 주소는 읽기보다 내비·지도 앱에 넘기려고 찾는다. 지도는 주소로 카카오맵 검색을 연다(키 없이 된다).
 * 복사가 막힌 브라우저에서는 직접 복사하도록 창을 띄운다(링크 복사 버튼과 같은 방식).
 */
export function AddressBar({ address, place }: { address: string; place?: { title: string; lat: number; lng: number } }) {
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);
  const pill = "inline-flex h-7 shrink-0 items-center rounded-full border-[1.5px] px-2.5 text-[12px] font-bold transition-colors";
  return (
    <div className={`flex gap-2 border-t-2 border-dashed border-ink/15 px-3 py-2 sm:px-4 ${full ? "items-start" : "items-center"}`}>
      <svg viewBox="0 0 24 24" aria-hidden className={`size-4 shrink-0 text-coral ${full ? "mt-1" : ""}`} fill="currentColor">
        <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
      </svg>
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
        {copied ? "복사했어요 ✓" : "복사"}
      </button>
      <a
        href={`https://map.kakao.com/link/search/${encodeURIComponent(address)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="카카오맵에서 이 주소 보기"
        className={`${pill} border-ink/25 bg-surface text-ink/75 hover:border-ink hover:text-ink`}
      >
        지도 <span aria-hidden className="ml-0.5">↗</span>
      </a>
      {/* 칸의 장소를 바꾸면 좌표가 바뀐다 — key 로 새로 만들어 앞 장소의 주차장 목록이 남지 않게 */}
      {place && <ParkingChip key={`${place.lat},${place.lng}`} placeName={place.title} lat={place.lat} lng={place.lng} pill={pill} />}
    </div>
  );
}
