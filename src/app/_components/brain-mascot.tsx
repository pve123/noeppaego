/**
 * 뇌빼고 캐릭터 — 앱 아이콘(src/app/icon.svg)의 뇌.
 * - relax: 선글라스 끼고 튜브 타고 쉬는 중(첫 화면, 다 짰을 때)
 * - puzzled: 튜브 없이 멍한 눈과 물음표(없는 페이지, 아직 아무것도 없을 때)
 * 장식이라 화면 읽기 프로그램에는 숨긴다.
 */
export function BrainMascot({ mood = "relax", className }: { mood?: "relax" | "puzzled"; className?: string }) {
  return (
    <svg viewBox="0 0 128 128" aria-hidden="true" className={className}>
      {mood === "relax" ? (
        <>
          <circle cx="100" cy="28" r="12" fill="#ffd54d" stroke="#22223B" strokeWidth="3" />
          <ellipse cx="64" cy="92" rx="44" ry="15" fill="#ff6b6b" stroke="#22223B" strokeWidth="4" />
          <ellipse cx="64" cy="90" rx="26" ry="6" fill="#7FD3F5" stroke="#22223B" strokeWidth="3" />
        </>
      ) : (
        <>
          <ellipse cx="64" cy="104" rx="30" ry="5" fill="#22223B" opacity=".12" />
          <path d="M96 22q0-10 9-10t9 9q0 6-7 9v5" fill="none" stroke="#22223B" strokeWidth="4" strokeLinecap="round" />
          <circle cx="107" cy="44" r="2.8" fill="#22223B" />
        </>
      )}
      <g transform={mood === "relax" ? "translate(34 46)" : "translate(34 52)"}>
        <path
          d="M8 30c-9-3-9-16 0-19c0-9 11-13 17-8c5-6 15-6 19 0c7-4 16 1 15 9c8 3 8 15 0 18c1 8-8 13-15 9c-5 6-14 6-19 0c-7 5-17 1-17-9z"
          fill="#ff9fb0"
          stroke="#22223B"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path d="M8 13q5 3 3 8M51 12q-5 3-3 8M22 4q2 4 0 7M38 4q-2 4 0 7" fill="none" stroke="#22223B" strokeWidth="2.4" strokeLinecap="round" />
        {mood === "relax" ? (
          <>
            <rect x="11" y="15" width="16" height="9" rx="4" fill="#22223B" />
            <rect x="31" y="15" width="16" height="9" rx="4" fill="#22223B" />
            <path d="M27 18h4" stroke="#22223B" strokeWidth="3" />
            <path d="M24 31q5 4 10 0" fill="none" stroke="#22223B" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="19" cy="19" r="6" fill="#fff" stroke="#22223B" strokeWidth="2.5" />
            <circle cx="39" cy="19" r="6" fill="#fff" stroke="#22223B" strokeWidth="2.5" />
            <circle cx="20" cy="21" r="2.2" fill="#22223B" />
            <circle cx="38" cy="16.5" r="2.2" fill="#22223B" />
            <ellipse cx="29" cy="31" rx="3.5" ry="4.5" fill="#22223B" />
          </>
        )}
      </g>
    </svg>
  );
}
