import type { PublicDataFailure } from "@/shared/public-data/public-data";

/** 보는 사람에게 하는 말만 — 키 설정 같은 운영자용 안내는 서버 로그(public-data.ts)에 남긴다 */
const MESSAGE: Record<PublicDataFailure, string> = {
  quota: "지금 찾는 사람이 많아 정보를 가져오지 못했어요. 조금 뒤에 다시 와 주세요.",
  "missing-key": "지금은 정보를 불러올 수 없어요. 조금 뒤에 다시 와 주세요.",
  rejected: "지금은 정보를 불러올 수 없어요. 조금 뒤에 다시 와 주세요.",
  unavailable: "정보를 가져오지 못했어요. 잠시 뒤에 다시 해 보세요.",
};

export function SourceError({
  subject,
  failure,
  code,
}: {
  /** 「공휴일 정보」「축제 정보」 */
  subject: string;
  failure: PublicDataFailure;
  code?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div role="alert" className="rounded-3xl border-[3px] border-dashed border-ink bg-surface px-6 py-10 text-center">
        <p className="font-display text-[26px]">{subject}를 불러오지 못했어요</p>
        <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed">{MESSAGE[failure]}</p>
        {code && <p className="mt-3 text-sm text-muted">결과 코드 {code}</p>}
      </div>
    </div>
  );
}
