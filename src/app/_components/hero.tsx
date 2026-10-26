export function Hero() {
  return (
    <section id="top" className="mx-auto flex max-w-6xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pt-12">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <span className="-rotate-3 self-start rounded-full border-[3px] border-ink bg-mint px-4 py-1.5 font-display text-[17px]">
          연차 계산은 맡겨 주세요
        </span>
        <h1 className="font-display text-[clamp(40px,6vw,80px)] leading-[1.12]">
          언제 떠나면
          <br />
          <span className="rounded-2xl bg-yellow px-2.5">가장 길게</span> 쉴까?
        </h1>
        <p className="max-w-[460px] text-lg leading-[1.8]">공휴일과 주말을 이어서 연차는 적게 쓰고 오래 쉬는 날을 찾아 드려요.</p>
        <a
          href="#next"
          className="inline-flex h-14 items-center self-start rounded-[18px] border-[3px] border-ink bg-coral px-7 font-display text-xl shadow-pop-sm transition-transform hover:-translate-y-0.5"
        >
          다음 연휴 보기
        </a>
      </div>

      {/* 휴대폰에서는 그림을 빼 첫 화면에 버튼까지 보이게 한다 */}
      <div className="hidden min-w-0 flex-1 justify-center md:flex">
        <div className="relative aspect-square w-[min(100%,400px)]">
          <div className="absolute inset-[6%] rounded-full border-[3px] border-ink bg-yellow" />
          <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden="true">
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
          <span aria-hidden className="absolute bottom-[12%] left-0 -rotate-[8deg] rounded-full border-[3px] border-ink bg-lavender px-3.5 py-1.5 font-display text-[17px]">#징검다리</span>
          <span aria-hidden className="absolute right-0 top-[42%] rotate-6 rounded-full border-[3px] border-ink bg-mint px-3.5 py-1.5 font-display text-[17px]">#황금연휴</span>
        </div>
      </div>
    </section>
  );
}
