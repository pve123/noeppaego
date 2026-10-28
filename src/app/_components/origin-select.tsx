"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * 출발지 고르기 — 버튼을 누르면 도시 칩이 그 자리에서 펼쳐진다(아래 카드를 덮지 않고 밀어낸다).
 * 고르면 접히고 바로 다시 찾는다(주소에 ?from= 으로 남아 공유된다). 접혀 있을 땐 inert 라 Tab·화면 낭독기에서 빠진다.
 * @param query 주소에 함께 남길 다른 값(예: `&reach=near`) — 출발지를 바꿔도 거리 선택을 지킨다
 */
export function OriginSelect({
  origins,
  selected,
  basePath,
  query = "",
}: {
  origins: { id: string; name: string }[];
  selected: string;
  basePath: string;
  query?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const current = origins.find((o) => o.id === selected) ?? origins[0];

  const pick = (originId: string) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (originId === selected) return;
    startTransition(() => router.push(`${basePath}?from=${originId}${query}`, { scroll: false }));
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
          <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="currentColor">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          {current.name}
          <svg viewBox="0 0 12 8" aria-hidden className={`ml-1 w-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
            <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* 높이 0 → 내용 높이로 부드럽게 — grid-template-rows 0fr ↔ 1fr */}
      <div
        id={`${id}-panel`}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <ul aria-label="출발지" className="flex flex-wrap gap-2 pt-3">
            {origins.map((o) => {
              const isSelected = o.id === selected;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() => pick(o.id)}
                    className={`inline-flex h-10 items-center gap-1 rounded-full border-2 px-4 font-display text-[16px] transition-colors ${
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
