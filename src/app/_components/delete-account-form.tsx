"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
    // 켜지면 빨강 바탕에 흰 글자 — 브랜드 코랄(다음 단계로 가는 버튼)과 달라야 지우는 버튼인 게 보인다
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className="inline-flex h-12 items-center justify-center gap-2 self-start whitespace-nowrap rounded-[16px] border border-transparent bg-danger px-6 font-display text-lg text-white shadow-pop-sm transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-ink/30 disabled:bg-surface disabled:text-ink/40 disabled:shadow-none"
    >
      {pending ? "지우는 중…" : "계정과 데이터 모두 삭제하기"}
    </button>
  );
}

/**
 * 탈퇴 영역 — 계정 화면 맨 아래에 접어 둔다(위험한 동작이 화면 절반을 차지하지 않게).
 * 바닥글·스토어의 「계정 삭제」 링크(#delete)로 들어오면 펼친 채로 연다.
 */
export function DeleteDetails({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const openOnHash = () => {
      if (location.hash === "#delete" && ref.current) {
        ref.current.open = true;
        ref.current.scrollIntoView({ block: "start" });
      }
    };
    openOnHash();
    window.addEventListener("hashchange", openOnHash);
    return () => window.removeEventListener("hashchange", openOnHash);
  }, []);
  return (
    <details ref={ref} id="delete" className="group scroll-mt-24 rounded-3xl border border-ink/10 bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-display text-lg text-muted hover:text-ink sm:px-6 [&::-webkit-details-marker]:hidden">
        <span id="delete-title">탈퇴하기</span>
        <svg viewBox="0 0 24 24" aria-hidden className="size-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
    </details>
  );
}
