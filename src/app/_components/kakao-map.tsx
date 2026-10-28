"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  /** 핀에 쓰는 짧은 글자 — 순번이나 「출발」 */
  badge: string;
  /** 이름 — 지도 위에 쓰지 않고 마우스를 올렸을 때만 보인다(이름표가 겹치면 읽을 수 없다) */
  label: string;
  tone: "coral" | "yellow" | "mint" | "lavender" | "ink";
  /** 주차장 — 일정 장소보다 작은 파란 네모 P(주차 표지판 모양) */
  parking?: boolean;
  /** 누르면 핀 위에 이름과 이 링크(「여기로 길찾기」 등)를 말풍선으로 띄운다 — 휴대폰엔 마우스 올림이 없다 */
  link?: { href: string; text: string };
};

const TONE: Record<MapPin["tone"], { bg: string; fg: string }> = {
  coral: { bg: "#ff6b6b", fg: "#22223b" },
  yellow: { bg: "#ffd84d", fg: "#22223b" },
  mint: { bg: "#3ccfb4", fg: "#22223b" },
  lavender: { bg: "#b8b5ff", fg: "#22223b" },
  ink: { bg: "#22223b", fg: "#fffbea" },
};

export type MapRoute = { tone: MapPin["tone"]; points: { lat: number; lng: number }[] };

/** 번호표 한 줄 — 누르면 pinIds 핀과 routeIndexes 선만 남긴다 */
export type MapLegendItem = {
  badge: string;
  text: string;
  tone: MapPin["tone"];
  pinIds: string[];
  routeIndexes: number[];
};

const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

/** 화면에서 이보다 가까운 핀은 서로 비켜 앉힌다(px) — 배지 지름보다 조금 크게 */
const MIN_GAP = 38;

/**
 * 카카오맵에 핀을 찍고 모든 핀이 보이게 맞춘다.
 * 가까운 핀은 겹치지 않게 비켜 앉히고 실제 위치에는 작은 점을 남긴다(확대·축소할 때마다 다시 계산).
 * 키(NEXT_PUBLIC_KAKAO_MAP_KEY)가 없거나 SDK 를 못 불러오면 지도 자리를 비운다 — 같은 정보가 카드에 있다.
 */
export function KakaoMap({
  pins,
  routes = [],
  label,
  title,
  caption,
  legend = [],
  tall = false,
}: {
  pins: MapPin[];
  routes?: MapRoute[];
  label: string;
  /** 번호표 — 핀 번호와 이름을 짝지어 읽게 한다. 누르면 그 핀과 선만 보인다. 데스크톱에서는 지도 오른쪽에 세로로 */
  legend?: MapLegendItem[];
  /** 지도 위 제목 — 지도가 숨으면 같이 숨는다 */
  title?: string;
  /** 지도 아래 안내 — 지도가 숨으면 같이 숨는다 */
  caption?: string;
  /** 세로로 긴 지도 — 전국 지도처럼 위아래로 긴 곳을 크게 보여 줄 때 */
  tall?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!APP_KEY);
  /** 지도를 다 그렸다 — 그 전에는 「지도를 그리는 중」을 덮어 둔다 */
  const [ready, setReady] = useState(false);
  /** 고른 번호표(badge). 없으면 전체 */
  const [focus, setFocus] = useState<string>();
  const focused = legend.find((item) => item.badge === focus);
  const shownPins = useMemo(() => (focused ? pins.filter((p) => focused.pinIds.includes(p.id)) : pins), [pins, focused]);
  const shownRoutes = useMemo(
    () => (focused ? routes.filter((_, i) => focused.routeIndexes.includes(i)) : routes),
    [routes, focused],
  );

  useEffect(() => {
    const pins = shownPins;
    const routes = shownRoutes;
    const element = container.current;
    if (!APP_KEY || !element || pins.length === 0) return;
    let cancelled = false;
    setReady(false);
    let observer: ResizeObserver | undefined;

    loadSdk(APP_KEY)
      .then((kakao) => {
        if (cancelled || !container.current) return;
        const { maps } = kakao;
        container.current.innerHTML = ""; // 핀이 바뀌면(일차 바꾸기) 새로 그린다
        const map = new maps.Map(container.current, { center: new maps.LatLng(pins[0].lat, pins[0].lng), level: 12 });
        const bounds = new maps.LatLngBounds();

        // 선 — 잉크 테두리 위에 색 선. 핀보다 아래에 깔린다.
        for (const route of routes.filter((r) => r.points.length > 1)) {
          const path = route.points.map((p) => new maps.LatLng(p.lat, p.lng));
          new maps.Polyline({ path, strokeWeight: 8, strokeColor: "#22223b", strokeOpacity: 0.85, zIndex: 0 }).setMap(map);
          new maps.Polyline({ path, strokeWeight: 4, strokeColor: TONE[route.tone].bg, strokeOpacity: 1, zIndex: 1 }).setMap(map);
        }

        // 링크가 있는 핀을 누르면 뜨는 말풍선 — 하나만 두고 옮겨 쓴다. 지도 빈 곳을 누르면 닫는다
        const bubble = new maps.CustomOverlay({ yAnchor: 1, zIndex: 5 });
        maps.event.addListener(map, "click", () => bubble.setMap(null));

        const placed = pins.map((pin) => {
          const at = new maps.LatLng(pin.lat, pin.lng);
          bounds.extend(at);
          new maps.CustomOverlay({ position: at, content: dotElement(pin), zIndex: 2 }).setMap(map);
          const badge = pinElement(pin);
          if (pin.link) {
            const link = pin.link;
            badge.addEventListener("click", (e) => {
              e.stopPropagation();
              bubble.setContent(bubbleElement(pin.label, link, () => bubble.setMap(null)));
              bubble.setPosition(at);
              bubble.setMap(map);
            });
          }
          new maps.CustomOverlay({ position: at, content: badge, yAnchor: 0.5, zIndex: 3 }).setMap(map);
          return { at, badge };
        });

        // 화면 좌표로 겹침을 보고, 겹치면 8방향으로 한 칸씩 밀어 빈자리에 앉힌다
        const spread = () => {
          const projection = map.getProjection();
          const taken: { x: number; y: number }[] = [];
          for (const { at, badge } of placed) {
            const p = projection.containerPointFromCoords(at);
            let dx = 0;
            let dy = 0;
            for (let step = 1; taken.some((q) => Math.hypot(q.x - (p.x + dx), q.y - (p.y + dy)) < MIN_GAP) && step <= 24; step++) {
              const angle = -Math.PI / 2 + (step - 1) * (Math.PI / 4);
              const radius = MIN_GAP * Math.ceil(step / 8);
              dx = Math.cos(angle) * radius;
              dy = Math.sin(angle) * radius;
            }
            taken.push({ x: p.x + dx, y: p.y + dy });
            badge.style.transform = `translate(${dx}px, ${dy}px)`;
          }
        };

        // 상자 크기가 정해진 뒤, 그리고 크기가 바뀔 때마다 모든 핀이 보이게 다시 맞춘다
        const fit = () => {
          map.relayout();
          if (pins.length > 1) map.setBounds(bounds, 40, 40, 40, 40);
          else map.setCenter(new maps.LatLng(pins[0].lat, pins[0].lng));
        };
        maps.event.addListener(map, "idle", spread);
        maps.event.addListener(map, "tilesloaded", () => !cancelled && setReady(true));
        // 타일 신호가 오지 않아도 덮개가 남아 있지 않게
        setTimeout(() => !cancelled && setReady(true), 3000);
        requestAnimationFrame(fit);
        observer = new ResizeObserver(() => fit());
        observer.observe(container.current);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      observer?.disconnect();
      element.innerHTML = ""; // 다음 핀이 없어도(장소 없는 날) 앞 지도가 남지 않게
    };
  }, [shownPins, shownRoutes]);

  if (failed) return null;
  return (
    <figure>
      {title && <h2 className="mb-4 font-display text-[26px]">{title}</h2>}
      <div className={legend.length > 0 ? "grid gap-4 md:grid-cols-[1fr_320px]" : ""}>
        <div className={`relative ${tall ? "h-[460px] md:h-[560px]" : "h-[360px] sm:h-[420px]"}`}>
          <div
            ref={container}
            role="img"
            aria-label={label}
            className="size-full overflow-hidden rounded-3xl border-[3px] border-ink bg-soft-ink shadow-pop"
          />
          {shownPins.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl border-[3px] border-ink bg-surface">
              <span className="px-4 text-center text-[15px] font-bold text-muted">지도에 표시할 장소가 없어요</span>
            </div>
          )}
          {!ready && shownPins.length > 0 && (
            <div
              role="status"
              aria-live="polite"
              className="shimmer absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl border-[3px] border-ink"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden className="loading-pin">
                <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" fill="#ff6b6b" stroke="#22223b" strokeWidth="2" />
                <circle cx="12" cy="9" r="2.5" fill="#fffbea" stroke="#22223b" strokeWidth="1.5" />
              </svg>
              <span className="rounded-full bg-surface px-4 py-1.5 text-[15px] font-bold">지도를 그리는 중</span>
            </div>
          )}
        </div>
        {legend.length > 0 && (
          <div className="self-start">
            <ul aria-label="지도 번호" className="space-y-2">
              {legend.map((item) => {
                const active = item.badge === focus;
                return (
                  <li key={item.badge}>
                    <button
                      type="button"
                      aria-pressed={active}
                      aria-label={`${item.text} 지도에서 보기`}
                      onClick={() => setFocus(active ? undefined : item.badge)}
                      className={`flex w-full items-start gap-3 rounded-2xl border-[2.5px] border-ink px-3 py-2.5 text-left transition-transform ${
                        active ? "-translate-y-0.5 bg-yellow shadow-pop-sm" : focus ? "bg-surface opacity-60 hover:opacity-100" : "bg-surface hover:-translate-y-0.5"
                      }`}
                    >
                      <span
                        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink font-display"
                        style={{ background: TONE[item.tone].bg, color: TONE[item.tone].fg }}
                      >
                        {item.badge}
                      </span>
                      <span className="min-w-0 flex-1 font-bold leading-snug [overflow-wrap:anywhere]">{item.text}</span>
                      {/* 안내 문장 대신 줄마다 「지도에서 보기」 표시 — 누를 수 있다는 걸 모양으로 알린다 */}
                      <span
                        aria-hidden
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                          active ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink/60"
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="6.5" />
                          <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
                          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
                        </svg>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {focus && (
              <button
                type="button"
                onClick={() => setFocus(undefined)}
                className="mt-3 h-11 rounded-full border-[2.5px] border-ink bg-surface px-5 font-display text-[17px] hover:bg-yellow"
              >
                전체 보기
              </button>
            )}
          </div>
        )}
      </div>
      {caption && <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

/** 시안의 스티커 모양 핀 — 번호만. 이름은 마우스를 올리면 보인다 */
const PARKING_BLUE = "#1d5fd6";

function pinElement(pin: MapPin): HTMLElement {
  const badge = document.createElement("span");
  badge.textContent = pin.badge;
  badge.title = pin.label;
  if (pin.parking) {
    badge.style.cssText = `display:flex;align-items:center;justify-content:center;width:28px;height:28px;box-sizing:border-box;border:2px solid #fff;border-radius:6px;background:${PARKING_BLUE};color:#fff;font:900 15px/1 sans-serif;box-shadow:0 0 0 1.5px #22223b;cursor:${pin.link ? "pointer" : "default"}`;
    if (pin.link) {
      badge.setAttribute("role", "button");
      badge.setAttribute("aria-label", `${pin.label} — ${pin.link.text}`);
    }
    return badge;
  }
  const { bg, fg } = TONE[pin.tone];
  badge.style.cssText = `display:flex;align-items:center;justify-content:center;min-width:34px;height:34px;padding:0 8px;box-sizing:border-box;border:3px solid #22223b;border-radius:999px;background:${bg};color:${fg};font-family:var(--font-jua),sans-serif;font-size:16px;box-shadow:2px 2px 0 #22223b;cursor:default;white-space:nowrap;transition:transform .15s`;
  return badge;
}

/** 핀 위 말풍선 — 이름과 링크 버튼, 닫기. 지도 위라 Tailwind 대신 인라인 스타일 */
function bubbleElement(label: string, link: { href: string; text: string }, close: () => void): HTMLElement {
  const box = document.createElement("div");
  box.style.cssText =
    "position:relative;margin-bottom:22px;display:flex;flex-direction:column;gap:8px;max-width:220px;padding:10px 12px;border:2.5px solid #22223b;border-radius:14px;background:#fffbea;color:#22223b;box-shadow:2px 2px 0 #22223b;font:600 14px/1.35 sans-serif";
  const head = document.createElement("div");
  head.style.cssText = "display:flex;align-items:flex-start;gap:8px";
  const name = document.createElement("span");
  name.textContent = label;
  name.style.cssText = "flex:1;word-break:keep-all;overflow-wrap:anywhere";
  const x = document.createElement("button");
  x.type = "button";
  x.textContent = "×";
  x.setAttribute("aria-label", "닫기");
  x.style.cssText = "flex:none;width:28px;height:28px;margin:-6px -6px 0 0;border:0;background:none;font-size:20px;line-height:1;color:#22223b99;cursor:pointer";
  x.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });
  head.append(name, x);
  const a = document.createElement("a");
  a.href = link.href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = link.text;
  a.style.cssText =
    "display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 14px;border:2.5px solid #22223b;border-radius:999px;background:#ffd84d;color:#22223b;font-weight:700;text-decoration:none";
  box.append(head, a);
  box.addEventListener("click", (e) => e.stopPropagation());
  return box;
}

/** 실제 위치 점 — 핀이 비켜 앉아도 어디인지 남긴다 */
function dotElement(pin: MapPin): HTMLElement {
  const dot = document.createElement("span");
  dot.style.cssText = `display:block;width:10px;height:10px;border-radius:999px;border:2px solid #22223b;background:${pin.parking ? PARKING_BLUE : TONE[pin.tone].bg}`;
  return dot;
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
