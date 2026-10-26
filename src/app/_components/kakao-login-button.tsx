import Link from "next/link";

/**
 * 카카오 로그인 버튼 — 카카오 디자인 가이드 색(#FEE500 바탕·검은 말풍선)으로 어디서나 같은 모양.
 * @param next 로그인 뒤 돌아올 우리 사이트 안 경로
 */
export function KakaoLoginButton({
  next,
  label = "카카오로 시작하기",
  size = "md",
}: {
  next: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizing = { sm: "h-10 px-4 text-[15px] gap-1.5", md: "h-12 px-5 text-[17px] gap-2", lg: "h-14 w-full px-6 text-lg gap-2" }[size];
  return (
    <Link
      href={`/api/auth/kakao?next=${encodeURIComponent(next)}`}
      prefetch={false}
      className={`inline-flex items-center justify-center rounded-xl bg-[#fee500] font-bold text-black/85 transition hover:brightness-95 ${sizing}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#000"
          d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.66 6.77l-.95 3.5a.4.4 0 0 0 .61.44l4.13-2.75c.51.06 1.03.09 1.55.09 5.52 0 10-3.58 10-8S17.52 3 12 3z"
        />
      </svg>
      {label}
    </Link>
  );
}
