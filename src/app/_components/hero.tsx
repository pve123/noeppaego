export function Hero() {
  return (
    <section id="top" className="mx-auto flex max-w-6xl flex-wrap items-center gap-10 px-4 pb-18 pt-12 sm:px-6">
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
        <span className="-rotate-3 self-start rounded-full border-[3px] border-ink bg-mint px-4 py-1.5 font-display text-[17px]">
          연차 계산은 저희가 할게요
        </span>
        <h1 className="font-display text-[clamp(44px,6.4vw,84px)] leading-[1.12]">
          언제 떠나면
          <br />
          <span className="rounded-2xl bg-yellow px-2.5">가장 길게</span> 쉴까?
        </h1>
        <p className="max-w-[480px] text-lg leading-[1.8]">
          공휴일과 주말을 이어서, 연차를 가장 적게 쓰고 가장 길게 쉬는 날을 골라 드려요.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="#next"
            className="inline-flex h-[58px] items-center rounded-[18px] border-[3px] border-ink bg-coral px-7 font-display text-xl shadow-pop-sm transition-transform hover:-translate-y-0.5"
          >
            다음 연휴 보기
          </a>
          <a
            href="#breaks"
            className="inline-flex h-[58px] items-center rounded-[18px] border-[3px] border-ink bg-surface px-6 font-display text-xl transition-transform hover:-translate-y-0.5"
          >
            1년 치 모아보기
          </a>
        </div>
      </div>

      <div className="flex min-w-0 flex-[1_1_420px] justify-center">
        <div className="relative aspect-square w-[min(100%,460px)]">
          <div className="absolute inset-[6%] rounded-full border-[3px] border-ink bg-yellow" />
          <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" role="img" aria-label="달력과 비행기 일러스트">
            <path d="M24 150 C 60 128, 84 160, 116 138 S 164 126, 180 96" fill="none" stroke="#22223B" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />
            <rect x="58" y="62" width="84" height="80" rx="14" fill="#FFFFFF" stroke="#22223B" strokeWidth="4" />
            <path d="M58 88 h84" stroke="#22223B" strokeWidth="4" />
            <rect x="58" y="62" width="84" height="26" rx="14" fill="#FF6B6B" stroke="#22223B" strokeWidth="4" />
            <path d="M80 54 v16 M120 54 v16" stroke="#22223B" strokeWidth="4" strokeLinecap="round" />
            <rect x="72" y="100" width="16" height="14" rx="4" fill="#FF6B6B" stroke="#22223B" strokeWidth="2.5" />
            <rect x="92" y="100" width="16" height="14" rx="4" fill="#FFD84D" stroke="#22223B" strokeWidth="2.5" />
            <rect x="112" y="100" width="16" height="14" rx="4" fill="#FF6B6B" stroke="#22223B" strokeWidth="2.5" />
            <rect x="72" y="118" width="16" height="14" rx="4" fill="#FF6B6B" stroke="#22223B" strokeWidth="2.5" />
            <path d="M150 34 l26 -8 l-8 26 l-6 -10 z" fill="#3CCFB4" stroke="#22223B" strokeWidth="3" strokeLinejoin="round" />
            <circle cx="36" cy="64" r="10" fill="#3CCFB4" stroke="#22223B" strokeWidth="3" />
            <circle cx="172" cy="152" r="7" fill="#B8B5FF" stroke="#22223B" strokeWidth="3" />
          </svg>
          <span className="absolute bottom-[12%] left-0 -rotate-[8deg] rounded-full border-[3px] border-ink bg-lavender px-3.5 py-1.5 font-display text-[17px]">#징검다리</span>
          <span className="absolute right-0 top-[42%] rotate-6 rounded-full border-[3px] border-ink bg-mint px-3.5 py-1.5 font-display text-[17px]">#황금연휴</span>
          <span className="absolute left-[8%] top-[4%] -rotate-[4deg] rounded-full border-[3px] border-ink bg-surface px-3.5 py-1.5 font-display text-[17px]">#연차1일</span>
        </div>
      </div>
    </section>
  );
}
