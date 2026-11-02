"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CrosshairIcon } from "./icons";

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
  link?: PinAction;
  /** 기준점(출발지) — 작게 그리고 겹침 계산에서 빼 번호 핀을 가리지 않는다. 늘 보인다 */
  anchor?: boolean;
};

/** bg 는 핀, line 은 선 — 노랑·라벤더는 흰 외곽선 위에서 묻혀 선만 한 단계 진하게 */
const TONE: Record<MapPin["tone"], { bg: string; fg: string; line: string }> = {
  coral: { bg: "#ff6b6b", fg: "#22223b", line: "#f25555" },
  yellow: { bg: "#ffd84d", fg: "#22223b", line: "#f2b705" },
  mint: { bg: "#3ccfb4", fg: "#22223b", line: "#20b39a" },
  lavender: { bg: "#b8b5ff", fg: "#22223b", line: "#8b86f2" },
  ink: { bg: "#22223b", fg: "#fffbea", line: "#22223b" },
};

/**
 * 선 — dashed 는 실제 길이 아니라 「어디서 어디까지」만 잇는 점선 직선.
 * onlyWhenFocused 는 처음엔 그리지 않고 번호표나 핀을 눌렀을 때만 그린다(선이 많으면 뒤엉킨다).
 */
export type MapRoute = { tone: MapPin["tone"]; points: { lat: number; lng: number }[]; dashed?: boolean; onlyWhenFocused?: boolean };

/** 번호표 한 줄 — 누르면 pinIds 핀과 routeIndexes 선만 남긴다 */
export type MapLegendItem = {
  badge: string;
  text: string;
  tone: MapPin["tone"];
  pinIds: string[];
  routeIndexes: number[];
};

/** 핀 말풍선의 버튼 — href 면 새 창 링크, onClick 이면 앱 안에서 할 일(길찾기 앱 고르기 등) */
export type PinAction = { text: string; href?: string; onClick?: () => void };

const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

/** 넘기지 않았을 때의 빈 목록 — 렌더마다 새 배열(`= []`)을 만들면 지도 그리기가 끝없이 다시 돈다 */
const NO_ROUTES: MapRoute[] = [];
const NO_LEGEND: MapLegendItem[] = [];

/** 핀이 하나일 때 축척 — 카카오 지도 4레벨은 골목과 큰 길이 함께 보이는 정도 */
const SINGLE_PIN_LEVEL = 4;

/** 화면에서 이보다 가까운 번호 핀은 겹친 것으로 본다(px) — 배지 지름보다 조금 크게 */
const MIN_GAP = 38;

/**
 * 카카오맵에 핀을 찍고 모든 핀이 보이게 맞춘다.
 * 핀은 늘 실제 위치에 둔다. 겹치면 앞 순서(먼저 넘긴 핀)에 번호를 모아 「1,2」로 보인다 — 확대하면 제자리 핀으로 나뉜다. 번호가 사라지지 않는다.
 * 키(NEXT_PUBLIC_KAKAO_MAP_KEY)가 없거나 SDK 를 못 불러오면 지도 자리를 비운다 — 같은 정보가 카드에 있다.
 */
export function KakaoMap({
  pins,
  routes = NO_ROUTES,
  label,
  title,
  caption,
  legend = NO_LEGEND,
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
  /** 확대·축소·전체 보기 버튼이 쓰는 지도와 맞추기 함수 */
  const controls = useRef<{ zoom(delta: number): void; fit(): void }>(undefined);
  const [failed, setFailed] = useState(!APP_KEY);
  /** 지도를 다 그렸다 — 그 전에는 「지도를 그리는 중」을 덮어 둔다 */
  const [ready, setReady] = useState(false);
  /** 고른 번호표(badge). 없으면 전체 */
  const [focus, setFocus] = useState<string>();
  const focused = legend.find((item) => item.badge === focus);
  const legendBadges = useMemo(() => new Set(legend.map((item) => item.badge)), [legend]);
  const shownPins = useMemo(() => (focused ? pins.filter((p) => focused.pinIds.includes(p.id)) : pins), [pins, focused]);
  const shownRoutes = useMemo(
    () => (focused ? routes.filter((_, i) => focused.routeIndexes.includes(i)) : routes.filter((r) => !r.onlyWhenFocused)),
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

        // 선 — 흰 외곽선 위에 진한 색 선(흐린 지도 위에서 또렷하게). 핀보다 아래에 깔린다. 점선은 길이 아니라서 외곽선 없이 얇게
        for (const route of routes.filter((r) => r.points.length > 1)) {
          const path = route.points.map((p) => new maps.LatLng(p.lat, p.lng));
          if (route.dashed) {
            new maps.Polyline({ path, strokeWeight: 3, strokeColor: "#22223b", strokeOpacity: 0.6, strokeStyle: "shortdash", zIndex: 0 }).setMap(map);
            continue;
          }
          new maps.Polyline({ path, strokeWeight: 8, strokeColor: "#ffffff", strokeOpacity: 1, zIndex: 0 }).setMap(map);
          new maps.Polyline({ path, strokeWeight: 5, strokeColor: TONE[route.tone].line, strokeOpacity: 1, zIndex: 1 }).setMap(map);
        }

        // 링크가 있는 핀을 누르면 뜨는 말풍선 — 하나만 두고 옮겨 쓴다. 지도 빈 곳을 누르면 닫는다
        const bubble = new maps.CustomOverlay({ yAnchor: 1, zIndex: 5 });
        maps.event.addListener(map, "click", () => bubble.setMap(null));

        const placed = pins.map((pin) => {
          const at = new maps.LatLng(pin.lat, pin.lng);
          bounds.extend(at);
          if (!pin.anchor) new maps.CustomOverlay({ position: at, content: dotElement(pin), zIndex: 2 }).setMap(map);
          const badge = pinElement(pin);
          // 번호표가 있는 핀은 누르면 그 지역에 집중한다(번호표를 누른 것과 같다)
          if (!pin.link && legendBadges.has(pin.badge)) {
            badge.style.cursor = "pointer";
            badge.addEventListener("click", (e) => {
              e.stopPropagation();
              setFocus((now) => (now === pin.badge ? undefined : pin.badge));
            });
          }
          if (pin.link) {
            const link = pin.link;
            badge.addEventListener("click", (e) => {
              e.stopPropagation();
              bubble.setContent(bubbleElement(pin.label, link, () => bubble.setMap(null)));
              bubble.setPosition(at);
              bubble.setMap(map);
            });
          }
          new maps.CustomOverlay({ position: at, content: badge, yAnchor: 0.5, zIndex: pin.anchor ? 4 : 3 }).setMap(map);
          return { at, badge, anchor: pin.anchor, pin };
        });

        // 화면 좌표로 겹침을 보고, 겹치는 번호는 앞 핀에 모은다(「1,2」). 핀을 옮기지 않아 확대·축소해도 튀지 않는다
        const declutter = () => {
          const projection = map.getProjection();
          const shown: { x: number; y: number; badge: HTMLElement; labels: string[] }[] = [];
          for (const { at, badge, anchor, pin } of placed) {
            if (anchor) continue;
            const p = projection.containerPointFromCoords(at);
            const host = shown.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < MIN_GAP);
            badge.style.visibility = host ? "hidden" : "visible";
            if (host) host.labels.push(pin.badge);
            else shown.push({ x: p.x, y: p.y, badge, labels: [pin.badge] });
          }
          for (const { badge, labels } of shown) badge.textContent = labels.join(",");
        };

        // 상자 크기가 정해진 뒤, 그리고 크기가 바뀔 때마다 모든 핀이 보이게 다시 맞춘다
        const fit = () => {
          map.relayout();
          if (pins.length > 1) map.setBounds(bounds, 40, 40, 40, 40);
          else {
            // 핀이 하나면 그 동네가 보이게 확대한다(처음 축척은 전국을 보는 크기)
            map.setLevel(SINGLE_PIN_LEVEL);
            map.setCenter(new maps.LatLng(pins[0].lat, pins[0].lng));
          }
        };
        maps.event.addListener(map, "zoom_changed", declutter);
        maps.event.addListener(map, "idle", declutter);
        controls.current = { zoom: (delta) => map.setLevel(map.getLevel() + delta, { animate: true }), fit };
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
      controls.current = undefined;
      observer?.disconnect();
      element.innerHTML = ""; // 다음 핀이 없어도(장소 없는 날) 앞 지도가 남지 않게
    };
  }, [shownPins, shownRoutes, legendBadges]);

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
            className="size-full overflow-hidden rounded-3xl border border-ink/10 bg-soft-ink shadow-pop [&_img]:opacity-90 [&_img]:grayscale-[0.85]"
          />
          {ready && shownPins.length > 0 && <MapControls onZoom={(d) => controls.current?.zoom(d)} onFit={() => controls.current?.fit()} />}
          {shownPins.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-ink/10 bg-surface">
              <span className="px-4 text-center text-[15px] font-bold text-muted">지도에 표시할 장소가 없어요</span>
            </div>
          )}
          {!ready && shownPins.length > 0 && (
            <div
              role="status"
              aria-live="polite"
              className="shimmer absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-ink/10"
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
                      className={`flex w-full items-start gap-3 rounded-2xl border border-ink/15 px-3 py-2.5 text-left transition-transform ${
                        active ? "-translate-y-0.5 bg-yellow shadow-pop-sm" : focus ? "bg-surface opacity-60 hover:opacity-100" : "bg-surface hover:-translate-y-0.5"
                      }`}
                    >
                      <span
                        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-ink/15 font-display"
                        style={{ background: TONE[item.tone].bg, color: TONE[item.tone].fg }}
                      >
                        {item.badge}
                      </span>
                      <span className="min-w-0 flex-1 font-bold leading-snug [overflow-wrap:anywhere]">{item.text}</span>
                      {/* 안내 문장 대신 줄마다 「지도에서 보기」 표시 — 누를 수 있다는 걸 모양으로 알린다 */}
                      <span
                        aria-hidden
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                          active ? "border-ink/10 bg-ink text-cream" : "border-ink/20 text-ink/60"
                        }`}
                      >
                        <CrosshairIcon className="size-4" />
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
                className="mt-3 h-11 rounded-full border border-ink/15 bg-surface px-5 font-display text-[17px] hover:bg-yellow"
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

/** 지도 오른쪽 위 버튼 — 확대·축소, 그리고 움직인 뒤 처음 보기로 돌아가기. 휴대폰에서도 누르기 쉽게 44px */
function MapControls({ onZoom, onFit }: { onZoom(delta: number): void; onFit(): void }) {
  const button = "flex size-11 items-center justify-center font-display text-[22px] leading-none hover:bg-yellow";
  return (
    <div className="absolute right-3 top-3 z-[5] flex flex-col overflow-hidden rounded-2xl border border-ink/15 bg-surface shadow-pop-sm">
      <button type="button" aria-label="확대" onClick={() => onZoom(-1)} className={button}>
        +
      </button>
      <button type="button" aria-label="축소" onClick={() => onZoom(1)} className={`${button} border-t-2 border-ink/15`}>
        −
      </button>
      <button type="button" aria-label="전체 보기" onClick={onFit} className={`${button} border-t-2 border-ink/15`}>
        <CrosshairIcon className="size-5" />
      </button>
    </div>
  );
}

/** 시안의 스티커 모양 핀 — 번호만. 이름은 마우스를 올리면 보인다 */
const PARKING_BLUE = "#1d5fd6";

function pinElement(pin: MapPin): HTMLElement {
  const badge = document.createElement("span");
  badge.textContent = pin.badge;
  badge.title = pin.label;
  if (pin.anchor) {
    badge.style.cssText = `display:flex;align-items:center;height:24px;padding:0 8px;box-sizing:border-box;border:2px solid #fff;border-radius:999px;background:#22223b;color:#fffbea;font:700 12px/1 var(--font-noto),sans-serif;box-shadow:0 2px 8px rgb(34 34 59 / 0.35);white-space:nowrap`;
    return badge;
  }
  if (pin.parking) {
    badge.style.cssText = `display:flex;align-items:center;justify-content:center;width:28px;height:28px;box-sizing:border-box;border:2px solid #fff;border-radius:6px;background:${PARKING_BLUE};color:#fff;font:900 15px/1 sans-serif;box-shadow:0 0 0 1.5px #22223b;cursor:${pin.link ? "pointer" : "default"}`;
    if (pin.link) {
      badge.setAttribute("role", "button");
      badge.setAttribute("aria-label", `${pin.label} — ${pin.link.text}`);
    }
    return badge;
  }
  const { bg, fg } = TONE[pin.tone];
  badge.style.cssText = `display:flex;align-items:center;justify-content:center;min-width:34px;height:34px;padding:0 8px;box-sizing:border-box;border:2.5px solid #fff;border-radius:999px;background:${bg};color:${fg};font:800 15px/1 var(--font-noto),sans-serif;box-shadow:0 2px 8px rgb(34 34 59 / 0.35);cursor:default;white-space:nowrap`;
  return badge;
}

/** 핀 위 말풍선 — 이름과 링크 버튼, 닫기. 지도 위라 Tailwind 대신 인라인 스타일 */
function bubbleElement(label: string, link: PinAction, close: () => void): HTMLElement {
  const box = document.createElement("div");
  box.style.cssText =
    "position:relative;margin-bottom:22px;display:flex;flex-direction:column;gap:8px;max-width:220px;padding:10px 12px;border:1px solid rgb(34 34 59 / 0.1);border-radius:14px;background:#fff;color:#22223b;box-shadow:0 10px 28px -8px rgb(34 34 59 / 0.3);font:600 14px/1.35 var(--font-noto),sans-serif";
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
  const a = document.createElement(link.onClick ? "button" : "a");
  if (link.onClick) {
    const run = link.onClick;
    (a as HTMLButtonElement).type = "button";
    a.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
      run();
    });
  } else if (a instanceof HTMLAnchorElement && link.href) {
    a.href = link.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  a.textContent = link.text;
  a.style.cssText =
    "display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 14px;border:0;border-radius:999px;background:#ffd84d;color:#22223b;font:700 14px/1 var(--font-noto),sans-serif;text-decoration:none;cursor:pointer";
  box.append(head, a);
  box.addEventListener("click", (e) => e.stopPropagation());
  return box;
}

/** 실제 위치 점 — 핀이 비켜 앉아도 어디인지 남긴다 */
function dotElement(pin: MapPin): HTMLElement {
  const dot = document.createElement("span");
  dot.style.cssText = `display:block;width:10px;height:10px;border-radius:999px;border:2px solid #fff;box-shadow:0 1px 4px rgb(34 34 59 / 0.35);background:${pin.parking ? PARKING_BLUE : TONE[pin.tone].bg}`;
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
