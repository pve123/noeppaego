"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { inApp, PLAY_STORE_URL } from "./play-store";

/**
 * 앱 설치 권유 — 쓸모를 느낀 순간에만, 화면을 막지 않는 아래쪽 카드로 한 번.
 *
 * 언제: ① 일정을 저장한 직후(/t/…?saved=1) ② 다른 날 세 번째로 찾아왔을 때. 처음 들어오자마자는 띄우지 않는다.
 * 어디: 첫 화면·공유 일정·찜한 일정만. 아래 고정 저장 바([data-save-bar])가 있는 화면은 겹쳐서 건너뛴다.
 * 안 띄움: 이미 설치(standalone·TWA), 닫은 뒤 14일, 설치할 수 없는 브라우저(아이폰의 카톡 등 앱 안 브라우저·데스크톱 사파리).
 * 기기별:
 * - 안드로이드: 플레이 스토어 앱으로 보낸다 — 웹앱보다 스토어 앱이 업데이트·리뷰로 이어진다
 * - 아이폰 사파리: 「공유 → 홈 화면에 추가」 안내
 * - 데스크톱 크롬·엣지: 브라우저 설치 창(beforeinstallprompt)
 * 기록은 이 브라우저의 localStorage 에만 둔다(서버로 보내지 않는다).
 */

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Mode = "play" | "ios" | "desktop";

const KEY = "ht_install";
const SNOOZE_DAYS = 14;
const VISITS_TO_ASK = 3;
const PAGES = [/^\/$/, /^\/t\/[^/]+$/, /^\/saved$/];

type Memory = { visits: number; lastDay?: string; snoozeUntil?: number; installed?: boolean };

function read(): Memory {
  try {
    return { visits: 0, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { visits: 0 };
  }
}
function write(m: Memory) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    // 사생활 보호 모드 등 — 기억 못 해도 동작은 같다
  }
}

const android = () => /Android/i.test(navigator.userAgent);

/** 아이폰·아이패드의 진짜 사파리 — 크롬·파이어폭스·카톡·인스타·네이버 앱 안 브라우저는 홈 화면 추가 메뉴가 없거나 다르다 */
function iosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|KAKAOTALK|Instagram|FBAN|FBAV|NAVER|Line\//i.test(ua);
}

/** 개발 서버에서만 모양 미리보기: ?install-preview=play|ios|desktop */
function previewMode(): Mode | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const p = new URLSearchParams(location.search).get("install-preview");
  return p === "play" || p === "ios" || p === "desktop" ? p : undefined;
}

/** 기기마다 다른 제목과 버튼 */
const COPY: Record<Mode, { title: string; action?: string }> = {
  play: { title: "앱으로 받아 두세요", action: "Google Play에서 받기" },
  ios: { title: "홈 화면에 두고 앱처럼 써 보세요" },
  desktop: { title: "컴퓨터에 앱으로 설치해 보세요", action: "앱으로 설치" },
};

export function InstallPrompt() {
  const pathname = usePathname();
  // 카드는 닫힌 채 시작해 서버와 첫 화면이 같다 — 기기 판별은 브라우저에서 처음 한 번
  const [mode, setMode] = useState<Mode | undefined>(() =>
    typeof window === "undefined" ? undefined : (previewMode() ?? (iosSafari() ? "ios" : android() ? "play" : undefined)),
  );
  const [open, setOpen] = useState(false);
  const deferred = useRef<InstallEvent | undefined>(undefined);
  const titleId = "install-prompt-title";

  // 브라우저가 「설치 가능」을 알려 주면 잡아 둔다(기본 미니 알림 대신 우리 카드로).
  // 안드로이드는 웹앱 대신 스토어 앱을 권하니 잡아 두기만 하고 모드는 그대로(play)
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as InstallEvent;
      if (!previewMode() && !android()) setMode("desktop");
    };
    const onInstalled = () => {
      write({ ...read(), installed: true });
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // 다른 날 찾아온 횟수 — 같은 날 여러 번은 한 번으로
  useEffect(() => {
    const m = read();
    const today = new Date().toDateString();
    if (m.lastDay !== today) write({ ...m, visits: m.visits + 1, lastDay: today });
  }, []);

  // 띄울지 정한다 — 페이지를 옮길 때마다 다시 본다
  useEffect(() => {
    if (!mode || open) return;
    if (previewMode()) {
      const t = setTimeout(() => setOpen(true), 300);
      return () => clearTimeout(t);
    }
    if (inApp()) return;
    const m = read();
    if (m.installed || (m.snoozeUntil && Date.now() < m.snoozeUntil)) return;
    if (!PAGES.some((re) => re.test(pathname))) return;
    const justSaved = /^\/t\//.test(pathname) && new URLSearchParams(location.search).get("saved") === "1";
    if (!justSaved && m.visits < VISITS_TO_ASK) return;
    // 화면을 읽을 틈을 주고 나서 — 저장 직후엔 「저장했어요」 문구를 먼저 보게
    const t = setTimeout(() => {
      if (!document.querySelector("[data-save-bar]")) setOpen(true);
    }, justSaved ? 1800 : 4000);
    return () => clearTimeout(t);
  }, [mode, open, pathname]);

  const close = useCallback(() => {
    write({ ...read(), snoozeUntil: Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000 });
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const install = async () => {
    if (mode === "play") {
      window.open(PLAY_STORE_URL, "_blank", "noopener");
      // 받았는지는 알 수 없다 — 다시 묻지 않게 접어 둔다
      return close();
    }
    const e = deferred.current;
    if (!e) return close();
    await e.prompt();
    const { outcome } = await e.userChoice;
    deferred.current = undefined;
    if (outcome === "accepted") {
      write({ ...read(), installed: true });
      setOpen(false);
    } else close();
  };

  if (!open || !mode) return null;

  return (
    <section
      aria-labelledby={titleId}
      className="install-in fixed inset-x-3 bottom-[calc(var(--tab-bar-h)_+_12px_+_env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-[26px] border border-ink/10 bg-surface p-4 shadow-pop sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <button
        type="button"
        onClick={close}
        aria-label="닫기. 2주 동안 다시 묻지 않아요."
        className="absolute right-2.5 top-2.5 flex size-9 items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <div className="flex items-center gap-3.5 pr-8">
        <span className="install-bob relative shrink-0">
          {/* 원본 그대로 — 이미지 최적화 캐시가 바뀌기 전 아이콘을 내주지 않게 */}
          <Image src="/icons/icon-192.png" alt="" width={56} height={56} unoptimized className="size-14 rounded-2xl border border-ink/15" />
          <span aria-hidden className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border border-ink/15 bg-mint text-[13px] font-bold">
            +
          </span>
        </span>
        <div className="min-w-0">
          <p id={titleId} className="font-display text-[19px] leading-tight">
            {COPY[mode].title}
          </p>
          <p className="mt-1 text-[14px] leading-snug text-balance text-muted">저장한 일정과 다음 연휴를 바로 열어 봐요.</p>
        </div>
      </div>

      {mode !== "ios" ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={install}
            className="h-12 flex-1 rounded-[16px] border border-ink/10 bg-coral font-display text-[17px] shadow-pop-sm transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            {COPY[mode].action}
          </button>
          <button type="button" onClick={close} className="h-12 rounded-[16px] px-4 font-display text-[16px] text-muted hover:bg-cream">
            나중에
          </button>
        </div>
      ) : (
        <ol className="mt-4 grid gap-1.5 text-[14px] font-bold">
          <li className="flex items-center gap-2 rounded-2xl bg-cream px-3 py-2.5">
            <Step n={1} />
            <span className="flex items-center gap-1">
              화면 아래
              <svg viewBox="0 0 24 24" className="size-5 text-[#0a84ff]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label="공유 버튼">
                <path d="M12 3v12M8 7l4-4 4 4" />
                <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
              </svg>
              공유 버튼 누르기
            </span>
          </li>
          <li className="flex items-center gap-2 rounded-2xl bg-cream px-3 py-2.5">
            <Step n={2} />
            <span>「홈 화면에 추가」 고르기</span>
          </li>
        </ol>
      )}
    </section>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-yellow font-display text-[13px]">
      {n}
    </span>
  );
}
