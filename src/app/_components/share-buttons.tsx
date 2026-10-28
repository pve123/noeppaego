"use client";

import { useState, useSyncExternalStore } from "react";
import { CopyLinkButton } from "./copy-link-button";
import { googleCalendarUrl, type CalendarTrip } from "./google-calendar";

/** 지도와 같은 카카오 JavaScript 키 — 카카오 개발자 콘솔 「플랫폼 > Web」에 사이트 도메인이 등록돼 있어야 보내진다 */
const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
const SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js";
const SDK_INTEGRITY = "sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy";

type KakaoShareSdk = {
  isInitialized(): boolean;
  init(key: string): void;
  Share: { sendDefault(settings: object): void };
};

let sdk: Promise<KakaoShareSdk> | undefined;

function loadShareSdk(): Promise<KakaoShareSdk> {
  sdk ??= new Promise<KakaoShareSdk>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.integrity = SDK_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      const kakao = (window as unknown as { Kakao?: KakaoShareSdk }).Kakao;
      if (!kakao || !APP_KEY) return reject(new Error("카카오 SDK 없음"));
      if (!kakao.isInitialized()) kakao.init(APP_KEY);
      resolve(kakao);
    };
    script.onerror = () => reject(new Error("카카오 SDK 를 불러오지 못함"));
    document.head.append(script);
  }).catch((e) => {
    sdk = undefined; // 다음에 누르면 다시 시도
    throw e;
  });
  return sdk;
}

/** 휴대폰 공유 창(navigator.share)이 있는가 — 서버와 첫 그림에서는 없다고 보고, 붙은 뒤 다시 본다 */
const useCanShare = () =>
  useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );

const BUTTON = "inline-flex h-11 items-center gap-1.5 rounded-full border-[2.5px] border-cream px-5 font-display text-[17px]";

/**
 * 공유 페이지의 보내기 버튼 — 카카오톡으로 보내기 · 휴대폰 공유 창(없으면 링크 복사) · 구글 캘린더에 넣기.
 * 주소는 누를 때 지금 페이지 주소로 만든다(서버는 배포 주소를 모른다).
 */
export function ShareButtons({
  id,
  title,
  description,
  calendar,
}: {
  id: string;
  title: string;
  description: string;
  calendar: Omit<CalendarTrip, "url">;
}) {
  const nativeShare = useCanShare();
  const [kakaoFailed, setKakaoFailed] = useState(false);
  const shareUrl = () => `${location.origin}/t/${id}`;

  const sendKakao = async () => {
    try {
      const kakao = await loadShareSdk();
      const url = shareUrl();
      const link = { mobileWebUrl: url, webUrl: url };
      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description,
          imageUrl: `${location.origin}/t/${id}/opengraph-image`,
          imageWidth: 1200,
          imageHeight: 630,
          link,
        },
        buttons: [{ title: "일정 보기", link }],
      });
    } catch {
      setKakaoFailed(true);
    }
  };

  const shareNative = async () => {
    try {
      await navigator.share({ title, text: description, url: shareUrl() });
    } catch {
      // 사용자가 공유 창을 닫았다 — 할 일 없음
    }
  };

  return (
    <>
      {APP_KEY && !kakaoFailed && (
        <button type="button" onClick={sendKakao} className={`${BUTTON} bg-[#fee500] text-[#191919]`}>
          카카오톡으로 보내기
        </button>
      )}
      {nativeShare ? (
        <button type="button" onClick={shareNative} className={`${BUTTON} bg-yellow text-ink`}>
          공유하기
        </button>
      ) : (
        <CopyLinkButton />
      )}
      <button
        type="button"
        onClick={() => window.open(googleCalendarUrl({ ...calendar, url: shareUrl() }), "_blank", "noopener")}
        className={`${BUTTON} bg-transparent text-cream hover:bg-cream/10`}
      >
        구글 캘린더에 넣기
      </button>
    </>
  );
}
