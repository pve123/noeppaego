import Link from "next/link";
import type { PublicDataFailure } from "@/shared/public-data/public-data";
import { BrainMascot } from "./brain-mascot";
import { BUTTON_MD, PRIMARY, SECONDARY } from "./button-styles";
import { RetryButton } from "./retry-button";

/**
 * 공공데이터를 못 불러왔을 때 — 막다른 길이 되지 않게 캐릭터와 다음 할 일(다시 해 보기·다른 곳으로)을 함께 보여 준다.
 * 사용자에게는 쉬운 말만. 결과 코드 같은 운영자용 정보는 서버 로그(public-data.ts)에 남기고 화면에는 숨겨 둔다(data-code).
 */

/** body 는 문장마다 한 줄 — 문장 가운데서 끊기지 않게 */
type Copy = { title: (subject: string) => string; body: string[]; mascot: "sleep" | "puzzled"; retry: boolean };

const COPY: Record<PublicDataFailure, Copy> = {
  // 하루 한도는 자정에 다시 채워진다 — 「조금 뒤」라고 하면 사실과 달라 시간을 그대로 말한다
  quota: {
    title: (subject) => `${subject}도 오늘은 쉬는 중이에요`,
    body: ["오늘은 찾는 분이 너무 많았어요.", "밤 12시가 지나면 다시 볼 수 있어요."],
    mascot: "sleep",
    retry: false,
  },
  unavailable: {
    title: (subject) => `${subject}를 불러오지 못했어요`,
    body: ["잠깐 연결이 고르지 않았어요.", "다시 해 보세요."],
    mascot: "puzzled",
    retry: true,
  },
  "missing-key": {
    title: (subject) => `${subject}를 불러오지 못했어요`,
    body: ["지금은 정보를 불러올 수 없어요.", "조금 뒤에 다시 와 주세요."],
    mascot: "puzzled",
    retry: true,
  },
  rejected: {
    title: (subject) => `${subject}를 불러오지 못했어요`,
    body: ["지금은 정보를 불러올 수 없어요.", "조금 뒤에 다시 와 주세요."],
    mascot: "puzzled",
    retry: true,
  },
};

export function SourceError({
  subject,
  failure,
  code,
  back,
}: {
  /** 「공휴일 정보」「축제 정보」「여행 정보」 */
  subject: string;
  failure: PublicDataFailure;
  /** 공공데이터포털 결과 코드 — 화면에는 보이지 않는다 */
  code?: string;
  /** 다른 곳으로 가는 길 — 이 정보 없이도 열리는 화면(예: 연휴 목록) */
  back?: { href: string; label: string };
}) {
  const copy = COPY[failure];
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6" data-code={code}>
      <div role="alert" className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-ink/10 bg-surface px-6 py-10 text-center shadow-pop">
        <BrainMascot mood={copy.mascot} className="size-32" />
        <p className="mt-4 font-display text-[24px] leading-snug text-balance">{copy.title(subject)}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {copy.body.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        {(copy.retry || back) && (
          <div className="mt-6 grid w-full gap-2 sm:flex sm:w-auto sm:justify-center">
            {copy.retry && <RetryButton className={`${BUTTON_MD} ${PRIMARY}`} />}
            {back && (
              <Link href={back.href} className={`${BUTTON_MD} ${copy.retry ? SECONDARY : PRIMARY}`}>
                {back.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
