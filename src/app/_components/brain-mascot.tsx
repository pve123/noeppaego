/**
 * 뇌빼고 캐릭터 — 앱 아이콘(src/app/icon.svg)의 뇌.
 * - relax: 선글라스 끼고 튜브 타고 쉬는 중(첫 화면)
 * - puzzled: 튜브 없이 멍한 눈과 물음표(없는 페이지, 아직 아무것도 없을 때)
 * - sleep: 선글라스를 이마에 올리고 튜브 위에서 조는 중(정보가 오늘은 쉬는 중일 때)
 *
 * SVG 대신 PNG 를 쓴다 — 삼성 인터넷 다크 모드가 SVG 선 색을 멋대로 바꿔 외곽선이 사라진다(사진은 건드리지 않는다).
 * 원본은 public/art/*.svg — 고치면 같은 이름의 PNG(512px, 투명 바탕)로 다시 내보낸다.
 * 물음표는 진한 선이라 어두운 화면에서는 밝은 물음표 그림으로 바꾼다.
 * 장식이라 화면 읽기 프로그램에는 숨긴다(alt="").
 */
export function BrainMascot({ mood = "relax", className }: { mood?: "relax" | "puzzled" | "sleep"; className?: string }) {
  if (mood === "relax" || mood === "sleep") {
    // eslint-disable-next-line @next/next/no-img-element -- 작은 장식 PNG 하나, 최적화 캐시를 거치지 않는다
    return <img src={`/art/mascot-${mood}.png`} alt="" width={512} height={512} className={className} />;
  }
  return (
    <picture>
      <source srcSet="/art/mascot-puzzled-dark.png" media="(prefers-color-scheme: dark)" />
      <img src="/art/mascot-puzzled.png" alt="" width={512} height={512} className={className} />
    </picture>
  );
}
