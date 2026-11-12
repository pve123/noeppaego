import { BrainMascot } from "./brain-mascot";

/**
 * 첫 화면 — 「지쳐서 떠나고 싶은데 알아볼 기운도 없는 사람」에게 다 짜 준다고 말한다.
 * 휴대폰에서도 캐릭터를 작게 보여 이름(뇌빼고)과 아이콘이 이어지게 한다.
 */
export function Hero() {
  return (
    <section id="top" className="mx-auto flex max-w-6xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pt-12">
      <div className="relative flex min-w-0 flex-1 flex-col gap-5">
        {/* 휴대폰: 제목 오른쪽 위에 작은 캐릭터 */}
        <div aria-hidden className="absolute -top-2 right-0 flex size-24 items-center justify-center rounded-full border border-ink/10 bg-sky md:hidden">
          <BrainMascot className="size-20" />
        </div>
        <p className="pr-28 font-bold text-muted md:pr-0">연차 계산부터 일정까지 다 짜 놨어요</p>
        <h1 className="font-brand text-[clamp(40px,6vw,80px)] leading-[1.12]">
          지쳤으면
          <br />
          <span className="rounded-2xl bg-yellow px-2.5">뇌 빼고</span> 떠나요
        </h1>
        <p className="text-[17px] text-muted">
          {/* 문장마다 한 줄 — 문장 가운데서 끊기지 않게 */}
          <span className="block">연차는 적게 쓰고 가장 길게 쉬는 날을 찾아 드려요.</span>
          <span className="block">갈 곳과 맛집과 숙소까지 다 짜 드려요.</span>
        </p>
        <a
          href="#next"
          className="inline-flex h-14 items-center self-start rounded-[18px] border border-ink/10 bg-coral px-7 font-display text-xl shadow-pop-sm transition-transform hover:-translate-y-0.5"
        >
          가장 가까운 연휴 보기
        </a>
      </div>

      {/* 넓은 화면: 하늘색 원 안에서 튜브 타고 쉬는 뇌 */}
      <div className="hidden min-w-0 flex-1 justify-center md:flex">
        <div className="relative aspect-square w-[min(100%,400px)]">
          <div className="absolute inset-[6%] rounded-full border border-ink/10 bg-sky" />
          <BrainMascot className="absolute inset-[14%] size-[72%]" />
          <span aria-hidden className="absolute bottom-[12%] left-0 -rotate-[8deg] rounded-full border border-ink/10 bg-lavender px-3.5 py-1.5 font-display text-[17px]">#징검다리</span>
          <span aria-hidden className="absolute right-0 top-[42%] rotate-6 rounded-full border border-ink/10 bg-mint px-3.5 py-1.5 font-display text-[17px]">#황금연휴</span>
        </div>
      </div>
    </section>
  );
}
