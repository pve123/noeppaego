import type { PublicDataFailure } from "@/shared/public-data/public-data";

const MESSAGE: Record<PublicDataFailure, string> = {
  "missing-key": "서버에 공공데이터포털 인증키가 없어요. 환경변수 DATA_GO_KR_SERVICE_KEY를 확인해 주세요.",
  rejected:
    "공공데이터포털이 요청을 거절했어요. 키를 막 받았다면 1~2시간 뒤에 다시 해 보세요. 계속 거절되면 Decoding 키를 넣었는지 확인해 주세요.",
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
