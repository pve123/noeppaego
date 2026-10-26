"use client";

import { useEffect, useRef, useState } from "react";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  /** 핀에 쓰는 짧은 글자 — 순번이나 「출발」 */
  badge: string;
  /** 핀 옆 이름 */
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
  caption,
}: {
  pins: MapPin[];
  routes?: MapRoute[];
  label: string;
  /** 지도 아래 안내 — 지도가 숨으면 같이 숨는다 */
  caption?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!APP_KEY);

  useEffect(() => {
    if (!APP_KEY || !container.current || pins.length === 0) return;
    let cancelled = false;

    loadSdk(APP_KEY)
      .then((kakao) => {
        if (cancelled || !container.current) return;
        const { maps } = kakao;
        const map = new maps.Map(container.current, { center: new maps.LatLng(pins[0].lat, pins[0].lng), level: 12 });
        const bounds = new maps.LatLngBounds();
        for (const pin of pins) {
          const at = new maps.LatLng(pin.lat, pin.lng);
          bounds.extend(at);
          new maps.CustomOverlay({ position: at, content: pinElement(pin), yAnchor: 1.1 }).setMap(map);
        }
        // 동선 — 잉크 테두리 위에 그날 색 점선
        for (const route of routes.filter((r) => r.points.length > 1)) {
          const path = route.points.map((p) => new maps.LatLng(p.lat, p.lng));
          new maps.Polyline({ path, strokeWeight: 7, strokeColor: "#22223b", strokeOpacity: 0.9 }).setMap(map);
          new maps.Polyline({ path, strokeWeight: 4, strokeColor: TONE[route.tone].bg, strokeOpacity: 1, strokeStyle: "shortdash" }).setMap(map);
        }
        if (pins.length > 1) map.setBounds(bounds, 48, 48, 48, 48);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [pins, routes]);

  if (failed) return null;
  return (
    <figure>
      <div
        ref={container}
        role="img"
        aria-label={label}
        className="h-[360px] w-full overflow-hidden rounded-3xl border-[3px] border-ink bg-soft-ink shadow-pop sm:h-[420px]"
      />
      {caption && <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

/** 시안의 스티커 모양 핀 — 번호 동그라미 + 이름표 */
function pinElement(pin: MapPin): HTMLElement {
  const { bg, fg } = TONE[pin.tone];
  const root = document.createElement("div");
  root.style.cssText =
    "display:flex;align-items:center;gap:6px;font-family:var(--font-jua),sans-serif;color:#22223b;white-space:nowrap";

  const badge = document.createElement("span");
  badge.textContent = pin.badge;
  badge.style.cssText = `display:flex;align-items:center;justify-content:center;min-width:34px;height:34px;padding:0 8px;box-sizing:border-box;border:3px solid #22223b;border-radius:999px;background:${bg};color:${fg};font-size:16px;box-shadow:2px 2px 0 #22223b`;

  const name = document.createElement("span");
  name.textContent = pin.label.length > 14 ? `${pin.label.slice(0, 13)}…` : pin.label;
  name.style.cssText =
    "padding:3px 9px;border:2.5px solid #22223b;border-radius:999px;background:#fff;font-size:14px";

  root.append(badge, name);
  return root;
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
