"use client";

import { useEffect, useRef, useState } from "react";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  /** 핀에 쓰는 짧은 글자 — 순번이나 「출발」 */
  badge: string;
  /** 이름 — 지도 위에 쓰지 않고 마우스를 올렸을 때만 보인다(이름표가 겹치면 읽을 수 없다) */
  label: string;
  tone: "coral" | "yellow" | "mint" | "lavender" | "ink";
};

const TONE: Record<MapPin["tone"], { bg: string; fg: string }> = {
  coral: { bg: "#ff6b6b", fg: "#22223b" },
  yellow: { bg: "#ffd84d", fg: "#22223b" },
  mint: { bg: "#3ccfb4", fg: "#22223b" },
  lavender: { bg: "#b8b5ff", fg: "#22223b" },
  ink: { bg: "#22223b", fg: "#fffbea" },
};

export type MapRoute = { tone: MapPin["tone"]; points: { lat: number; lng: number }[] };

const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

/**
 * 카카오맵에 핀을 찍고 모든 핀이 보이게 맞춘다.
 * 키(NEXT_PUBLIC_KAKAO_MAP_KEY)가 없거나 SDK 를 못 불러오면 지도 자리를 비운다 — 같은 정보가 카드에 있다.
 */
export function KakaoMap({
  pins,
  routes = [],
  label,
  title,
  caption,
  legend = [],
}: {
  pins: MapPin[];
  routes?: MapRoute[];
  label: string;
  /** 지도 아래 번호표 — 핀 번호와 이름을 짝지어 읽게 한다 */
  legend?: { badge: string; text: string; tone: MapPin["tone"] }[];
  /** 지도 위 제목 — 지도가 숨으면 같이 숨는다 */
  title?: string;
  /** 지도 아래 안내 — 지도가 숨으면 같이 숨는다 */
  caption?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!APP_KEY);

  useEffect(() => {
    if (!APP_KEY || !container.current || pins.length === 0) return;
    let cancelled = false;
    let observer: ResizeObserver | undefined;

    loadSdk(APP_KEY)
      .then((kakao) => {
        if (cancelled || !container.current) return;
        const { maps } = kakao;
        container.current.innerHTML = ""; // 핀이 바뀌면(일차 바꾸기) 새로 그린다
        const map = new maps.Map(container.current, { center: new maps.LatLng(pins[0].lat, pins[0].lng), level: 12 });
        const bounds = new maps.LatLngBounds();
        for (const pin of pins) {
          const at = new maps.LatLng(pin.lat, pin.lng);
          bounds.extend(at);
          new maps.CustomOverlay({ position: at, content: pinElement(pin), yAnchor: 0.5, zIndex: 2 }).setMap(map);
        }
        // 선 — 잉크 테두리 위에 색 선. 핀보다 아래에 깔린다.
        for (const route of routes.filter((r) => r.points.length > 1)) {
          const path = route.points.map((p) => new maps.LatLng(p.lat, p.lng));
          new maps.Polyline({ path, strokeWeight: 8, strokeColor: "#22223b", strokeOpacity: 0.85, zIndex: 0 }).setMap(map);
          new maps.Polyline({ path, strokeWeight: 4, strokeColor: TONE[route.tone].bg, strokeOpacity: 1, zIndex: 1 }).setMap(map);
        }
        // 상자 크기가 정해진 뒤, 그리고 크기가 바뀔 때마다 모든 핀이 보이게 다시 맞춘다
        const fit = () => {
          map.relayout();
          if (pins.length > 1) map.setBounds(bounds, 56, 56, 56, 56);
          else map.setCenter(new maps.LatLng(pins[0].lat, pins[0].lng));
        };
        requestAnimationFrame(fit);
        observer = new ResizeObserver(() => fit());
        observer.observe(container.current);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [pins, routes]);

  if (failed) return null;
  return (
    <figure>
      {title && <h2 className="mb-4 font-display text-[26px]">{title}</h2>}
      <div
        ref={container}
        role="img"
        aria-label={label}
        className="h-[360px] w-full overflow-hidden rounded-3xl border-[3px] border-ink bg-soft-ink shadow-pop sm:h-[420px]"
      />
      {legend.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {legend.map((item) => (
            <li key={item.badge} className="flex items-center gap-2 rounded-full border-[2.5px] border-ink bg-surface py-1 pl-1 pr-3 text-[15px]">
              <span
                className="flex size-7 items-center justify-center rounded-full border-2 border-ink font-display"
                style={{ background: TONE[item.tone].bg, color: TONE[item.tone].fg }}
              >
                {item.badge}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      )}
      {caption && <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

/** 시안의 스티커 모양 핀 — 번호만. 이름은 마우스를 올리면 보인다 */
function pinElement(pin: MapPin): HTMLElement {
  const { bg, fg } = TONE[pin.tone];
  const badge = document.createElement("span");
  badge.textContent = pin.badge;
  badge.title = pin.label;
  badge.style.cssText = `display:flex;align-items:center;justify-content:center;min-width:36px;height:36px;padding:0 9px;box-sizing:border-box;border:3px solid #22223b;border-radius:999px;background:${bg};color:${fg};font-family:var(--font-jua),sans-serif;font-size:17px;box-shadow:2px 2px 0 #22223b;cursor:default;white-space:nowrap`;
  return badge;
}

// ── SDK 불러오기(한 번만) ────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- 카카오 SDK 는 타입 정의를 주지 않는다 */
type Kakao = { maps: any };
declare global {
  interface Window {
    kakao?: Kakao & { maps: { load(callback: () => void): void } };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

let sdk: Promise<Kakao> | undefined;

function loadSdk(appKey: string): Promise<Kakao> {
  sdk ??= new Promise<Kakao>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.async = true;
    script.onload = () => {
      const kakao = window.kakao;
      if (!kakao) return reject(new Error("kakao sdk missing"));
      kakao.maps.load(() => resolve(kakao));
    };
    script.onerror = () => {
      sdk = undefined; // 다음에 다시 시도
      reject(new Error("kakao sdk load failed"));
    };
    document.head.append(script);
  });
  return sdk;
}
