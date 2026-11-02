"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { deleteAccountAction } from "../actions";

/**
 * 탈퇴 폼 — 무엇이 사라지는지 읽고 「이해했어요」를 체크해야 버튼이 켜진다(실수로 누르지 않게, 그 이상은 막지 않는다).
 * 붙잡는 문구·숨긴 버튼·설문 같은 건 두지 않는다.
 */
export function DeleteAccountForm() {
  const [agreed, setAgreed] = useState(false);
  const failed = useSearchParams().get("delete") === "failed";

  return (
    <form action={deleteAccountAction} className="mt-5 flex flex-col gap-4">
      {failed && (
        <p role="alert" className="rounded-2xl border border-ink/15 bg-coral px-4 py-3 text-[15px] font-bold">
          탈퇴를 마치지 못했어요. 아무것도 지우지 않았으니 잠시 뒤 다시 눌러 주세요.
        </p>
      )}
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/15 bg-cream px-4 py-3.5 has-[:checked]:bg-yellow">
        <input
          type="checkbox"
          name="confirm"
          value="yes"
          required
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-ink"
        />
        <span className="text-[15px] font-bold leading-relaxed">위 내용을 확인했고 지운 정보는 되돌릴 수 없다는 걸 이해했어요.</span>
      </label>
      <SubmitButton disabled={!agreed} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className="inline-flex h-13 items-center justify-center gap-2 self-start rounded-[16px] border border-ink/10 bg-coral px-6 font-display text-lg shadow-pop-sm transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-ink/30 disabled:bg-surface disabled:text-ink/40 disabled:shadow-none"
    >
      {pending ? "지우는 중…" : "계정과 데이터 모두 삭제하기"}
    </button>
  );
}
