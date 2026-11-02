"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { canOpenNavApp, NAV_APPS, openRoute, recentApp, webRouteUrl, type Destination, type NavApp } from "./navigation";
import { Sheet } from "./sheet";

/**
 * 「어떤 앱으로 갈까요?」 — 길찾기 버튼이 여는 앱 고르기 시트. 마지막으로 고른 앱을 맨 위에 「최근」으로 둔다.
 * PC 는 내비 앱이 없어 시트 없이 웹 길찾기를 바로 연다.
 * 여는 쪽 하나에 시트 하나 — open(목적지) 로 연다.
 */
export function useRouteChooser(): { open(destination: Destination): void; sheet: ReactNode } {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [destination, setDestination] = useState<Destination>();
  const [recent, setRecent] = useState<NavApp>();

  const open = (d: Destination) => {
    if (!canOpenNavApp()) {
      window.open(webRouteUrl(d), "_blank", "noopener");
      return;
    }
    setDestination(d);
    setRecent(recentApp());
    dialog.current?.showModal();
  };

  const apps = recent ? [...NAV_APPS].sort((a, b) => Number(b.id === recent) - Number(a.id === recent)) : NAV_APPS;

  const sheet = (
    <Sheet dialogRef={dialog} titleId={titleId} title="어떤 앱으로 갈까요?">
      {destination && (
        <>
          <p className="truncate text-sm text-muted">{destination.name}까지 길을 찾아요.</p>
          <ul className="mt-4 space-y-2">
            {apps.map((app) => (
              <li key={app.id}>
                <button
                  type="button"
                  onClick={() => {
                    dialog.current?.close();
                    openRoute(app.id, destination);
                  }}
                  className="flex h-14 w-full items-center justify-between rounded-2xl border border-ink/10 bg-surface px-4 text-left font-display text-[17px] hover:bg-yellow"
                >
                  {app.label}
                  {app.id === recent && <span className="rounded-full bg-yellow px-2 py-0.5 text-[12px]">최근</span>}
                </button>
              </li>
            ))}
          </ul>
          <a
            href={webRouteUrl(destination)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => dialog.current?.close()}
            className="mt-3 block py-2 text-center text-sm font-bold text-muted underline underline-offset-4"
          >
            앱 없이 웹에서 보기
          </a>
        </>
      )}
    </Sheet>
  );

  return { open, sheet };
}
