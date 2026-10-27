"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * 출발지 고르기 — 고르면 바로 다시 찾는다(주소에 ?from= 으로 남아 공유된다).
 * 기본 <select> 메뉴는 운영체제 모양이라 사이트와 겉돌아서 목록을 직접 그린다. 키보드는 listbox 규칙(↑↓·Home·End·Enter·Esc)을 따른다.
 */
export function OriginSelect({
  origins,
  selected,
  basePath,
}: {
  origins: { id: string; name: string }[];
  selected: string;
  basePath: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const current = origins.find((o) => o.id === selected) ?? origins[0];

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const close = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const show = () => {
    setActive(Math.max(0, origins.findIndex((o) => o.id === selected)));
    setOpen(true);
  };

  const pick = (originId: string) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (originId === selected) return;
    startTransition(() => router.push(`${basePath}?from=${originId}`, { scroll: false }));
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const last = origins.length - 1;
    const move: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    };
    if (e.key in move) {
      e.preventDefault();
      setActive(move[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(origins[active].id);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div ref={rootRef} className="inline-flex flex-wrap items-center gap-2 font-bold">
      <span id={`${id}-label`}>어디서 출발하세요?</span>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label ${id}-button`}
          id={`${id}-button`}
          onClick={() => (open ? setOpen(false) : show())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              show();
            }
          }}
          className={`inline-flex h-11 min-w-[112px] items-center justify-between gap-3 rounded-full border-[2.5px] border-ink bg-surface pl-4 pr-3 font-display text-[17px] font-normal transition-transform hover:-translate-y-0.5 ${
            open ? "shadow-pop-sm" : ""
          } ${pending ? "opacity-60" : ""}`}
        >
          {current.name}
          <svg viewBox="0 0 12 8" aria-hidden className={`w-3 transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            aria-activedescendant={`${id}-${origins[active].id}`}
            onKeyDown={onListKey}
            className="absolute left-0 top-[calc(100%+8px)] z-30 grid w-max min-w-full grid-cols-2 gap-1 rounded-2xl border-[2.5px] border-ink bg-surface p-1.5 font-display text-[17px] font-normal shadow-pop outline-none"
          >
            {origins.map((o, i) => {
              const isSelected = o.id === selected;
              return (
                <li
                  key={o.id}
                  id={`${id}-${o.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(o.id)}
                  className={`flex cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-xl px-4 py-2 ${
                    isSelected ? "bg-mint" : i === active ? "bg-yellow" : ""
                  }`}
                >
                  {o.name}
                  {isSelected && <span aria-hidden>✓</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
