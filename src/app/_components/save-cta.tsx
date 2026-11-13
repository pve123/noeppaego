import { saveItineraryAction } from "../actions";
import { KakaoLoginButton } from "./kakao-login-button";

/** prefs 는 일정 주소의 여행 취향 부분(`with=kids&pace=relaxed`) */
type SaveTarget = { start: string; region: string; picks: Record<string, string>; prefs: string; here: string };

const BENEFITS = ["저장한 일정은 언제든 다시 볼 수 있어요", "링크 하나로 함께 갈 사람에게 보내요", "마음에 드는 일정을 찜해 모아 둬요"];

/**
 * 일정 저장 카드 — 로그인 전에는 저장하면 좋은 점과 카카오 로그인, 로그인 뒤에는 저장 버튼.
 * 로그인하고 돌아오면 #save 로 온다(넓은 화면은 이 카드, 휴대폰은 아래 저장 바). 자동으로 저장하지는 않는다 — 한 번 더 눌러야 저장된다.
 * 휴대폰에서는 숨긴다 — 아래 고정 저장 바가 같은 일을 하고, 카드가 있으면 1일차가 화면 두 번 아래로 밀린다.
 */
export function SaveCard({ loggedIn, target }: { loggedIn: boolean; target: SaveTarget }) {
  return (
    <section
      id="save"
      aria-labelledby="save-title"
      className="hidden scroll-mt-6 rounded-3xl border border-ink/10 bg-surface p-5 shadow-pop sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6"
    >
      <div>
        <h2 id="save-title" className="font-display text-[24px] leading-tight">
          {loggedIn ? "이 일정 저장하고 공유할까요?" : "이 일정 저장해 둘까요?"}
        </h2>
        {loggedIn ? (
          <p className="mt-1 text-[15px] text-muted">저장하면 공유할 수 있는 링크가 만들어지고 찜한 일정에도 들어가요.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-[15px]">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-bold">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 shrink-0 sm:mt-0 sm:text-right">
        {loggedIn ? (
          <SaveButton target={target} />
        ) : (
          <KakaoLoginButton next={`${target.here}#save`} />
        )}
      </div>
    </section>
  );
}

/** 휴대폰 아래 고정 바 — 긴 일정을 내려도 저장(또는 로그인)이 손 닿는 곳에 있다. 아래 탭 바로 위에 얹힌다 */
export function SaveBar({ loggedIn, target }: { loggedIn: boolean; target: SaveTarget }) {
  return (
    <div data-save-bar className="fixed inset-x-0 bottom-[calc(var(--tab-bar-h)_+_env(safe-area-inset-bottom))] z-40 border-t border-ink/10 bg-cream/95 px-4 py-2 backdrop-blur sm:hidden">
      {loggedIn ? (
        <SaveButton target={target} full />
      ) : (
        <KakaoLoginButton next={`${target.here}#save`} label="카카오로 시작하고 일정 저장하기" size="bar" />
      )}
    </div>
  );
}

function SaveButton({ target, full = false }: { target: SaveTarget; full?: boolean }) {
  return (
    <form action={saveItineraryAction}>
      <input type="hidden" name="start" value={target.start} />
      <input type="hidden" name="region" value={target.region} />
      <input type="hidden" name="picks" value={JSON.stringify(target.picks)} />
      <input type="hidden" name="prefs" value={target.prefs} />
      <input type="hidden" name="back" value={target.here} />
      <button
        type="submit"
        className={`inline-flex items-center justify-center gap-2 rounded-[18px] border border-ink/10 bg-coral px-6 font-display text-lg shadow-pop-sm transition-transform hover:-translate-y-0.5 ${
          full ? "h-12 w-full" : "h-14"
        }`}
      >
        이 일정 저장하고 공유하기
      </button>
    </form>
  );
}
