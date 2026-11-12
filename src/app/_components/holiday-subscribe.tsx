"use client";

import { useState } from "react";

/** 구독 주소는 늘 운영 주소 — 캘린더 앱이 밖에서 받아 가야 해서 로컬 주소로는 구독할 수 없다 */
const FEED = "https://holiday-trip.vercel.app/holidays.ics";
const WEBCAL = FEED.replace(/^https:/, "webcal:");
const GOOGLE = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(WEBCAL)}`;

const BUTTON = "inline-flex h-11 items-center gap-1 rounded-full border border-ink/15 bg-surface px-4 font-display text-[16px] hover:bg-yellow";

/** 연휴 구독 캘린더 — 구글 캘린더, 아이폰 캘린더, 그 밖의 앱은 주소 복사 */
export function HolidaySubscribe() {
  const [copied, setCopied] = useState(false);
  return (
    <section aria-labelledby="holiday-subscribe-title" className="mt-12 rounded-3xl border border-ink/10 bg-surface p-5 shadow-pop sm:p-6">
      <h3 id="holiday-subscribe-title" className="font-display text-[22px] leading-tight">
        연휴를 내 캘린더에서 보기
      </h3>
      <p className="mt-1 text-[15px] text-muted">한 번 구독하면 올해와 내년 연휴가 캘린더에 들어와요.</p>
      <p className="text-[15px] text-muted">대체공휴일이 생기면 알아서 바뀌어요.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={GOOGLE} target="_blank" rel="noopener noreferrer" className={BUTTON}>
          구글 캘린더에 추가 <span aria-hidden>↗</span>
        </a>
        <a href={WEBCAL} className={BUTTON}>
          아이폰 캘린더에 추가 <span aria-hidden>↗</span>
        </a>
        <button
          type="button"
          className={BUTTON}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(FEED);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              prompt("이 주소를 캘린더 앱에 구독으로 넣어 주세요", FEED);
            }
          }}
        >
          {copied ? "복사했어요" : "구독 주소 복사"}
        </button>
      </div>
    </section>
  );
}
