/**
 * 앱 시작 애니메이션 「선글라스 척」 — 앱(TWA)으로 처음 열 때만 1초 남짓.
 * 정지 스플래시(android 의 splash.png, 같은 캐릭터)가 사라지면 이 장면이 이어받아,
 * 뇌가 선글라스를 이마로 올려 윙크하고 다시 척 쓴 뒤 화면이 열린다.
 *
 * 언제 보일지는 그리기 전에 정해야 깜빡이지 않는다 — <head> 의 짧은 스크립트가 <html data-intro> 를 붙이고,
 * CSS(globals.css 「앱 시작 애니메이션」)가 그 표시가 있을 때만 이 장면을 보여 준 뒤 스스로 사라진다.
 * 안 보임: 브라우저로 열었을 때, 같은 탭에서 두 번째부터, 움직임 줄이기를 켰을 때.
 * 그림은 삼성 인터넷 다크 모드가 색을 바꾸지 못하게 PNG 부품(public/art/intro)으로 쌓는다.
 */

/** 앱으로 처음 열었는지 보고 표시를 붙인다. 주소에 ?intro-preview 를 붙이면 브라우저에서도 미리 볼 수 있다 */
const DECIDE = `try{var p=/[?&]intro-preview\\b/.test(location.search),a=document.referrer.indexOf("android-app://")===0;if(a)sessionStorage.setItem("ht_twa","1");if((p||(a&&!sessionStorage.getItem("ht_intro")))&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.setAttribute("data-intro","");sessionStorage.setItem("ht_intro","1")}}catch(e){}`;

export function AppIntroScript() {
  return <script dangerouslySetInnerHTML={{ __html: DECIDE }} />;
}

export function AppIntro() {
  return (
    <div aria-hidden className="app-intro">
      <div className="app-intro-stage">
        {/* eslint-disable-next-line @next/next/no-img-element -- 부품을 정확히 겹쳐야 해서 원본 그대로 쓴다 */}
        <img src="/art/intro/body.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/intro/wink.png" alt="" className="app-intro-wink" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/intro/glasses.png" alt="" className="app-intro-glasses" />
      </div>
    </div>
  );
}
