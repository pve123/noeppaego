import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageBand } from "../_components/page-band";
import { SiteFooter, SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 계획은 J가",
  description: "어떤 정보를 왜 받고, 언제 지우는지 알려 드려요.",
};

/** 시행일 — 내용을 바꾸면 날짜도 바꾸고 「바뀐 내용」에 한 줄 남긴다 */
const EFFECTIVE = "2026년 10월 30일";
/** 개인정보 문의 — 스토어 등록 정보의 연락처와 같게 */
const CONTACT_EMAIL = "tkddlfdlfemd@gmail.com";

const SECTIONS = [
  { id: "collect", title: "받는 정보" },
  { id: "purpose", title: "쓰는 곳" },
  { id: "retention", title: "보관과 삭제" },
  { id: "delete-account", title: "계정 삭제(탈퇴)" },
  { id: "processors", title: "맡기는 곳과 국외 이전" },
  { id: "cookies", title: "쿠키" },
  { id: "rights", title: "이용자의 권리" },
  { id: "security", title: "안전하게 지키는 방법" },
  { id: "children", title: "만 14세 미만" },
  { id: "contact", title: "문의" },
  { id: "changes", title: "바뀐 내용" },
] as const;

/**
 * 개인정보처리방침 — 위에 「한눈에 보기」, 아래에 자세한 내용. 쉬운 말로, 실제로 하는 것만 적는다.
 * 플레이 스토어 「개인정보처리방침 URL」과 「계정 삭제 URL(#delete-account)」로 쓴다.
 */
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageBand eyebrow={`시행일 ${EFFECTIVE}`} title="개인정보처리방침" sub="필요한 것만 받고, 탈퇴하면 바로 지워요." />

        {/* 왼쪽 끝은 제목 띠와 맞추고(6xl), 읽기 폭은 좁게(3xl) */}
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 [&>*]:max-w-3xl">
          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className="font-display text-[24px]">
              한눈에 보기
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              <Summary tone="bg-mint" title="로그인 없이도 써요">
                연휴 찾기, 갈 곳, 일정 짜기는 아무 정보 없이 쓸 수 있어요.
              </Summary>
              <Summary tone="bg-yellow" title="꼭 필요한 것만 받아요">
                로그인하면 카카오 회원 번호와 닉네임만 받아요. 위치는 「내 위치로」를 누를 때만 약 1km 단위로 쓰고 저장하지 않아요.
              </Summary>
              <Summary tone="bg-lavender" title="팔거나 넘기지 않아요">
                광고나 마케팅에 쓰지 않고, 다른 회사에 제공하지 않아요.
              </Summary>
              <Summary tone="bg-coral" title="탈퇴하면 바로 삭제">
                <Link href="/account#delete" className="underline underline-offset-4">
                  내 계정
                </Link>
                에서 언제든 탈퇴할 수 있고, 그 즉시 모두 지워져요.
              </Summary>
            </ul>
          </section>

          <nav aria-label="목차" className="mt-10 rounded-3xl border-[2.5px] border-ink bg-surface p-5">
            <p className="font-display text-lg">목차</p>
            <ol className="mt-2 grid gap-x-6 gap-y-1 text-[15px] sm:grid-cols-2">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="hover:underline">
                    <span className="mr-1.5 tabular-nums text-muted">{i + 1}.</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 flex flex-col gap-10 text-[16px] leading-[1.8]">
            <Section n={1}>
              <p>계획은 J가(이하 「서비스」)는 카카오로 로그인하거나 해당 기능을 쓸 때만 아래 정보를 받아요.</p>
              <Table
                head={["정보", "언제", "필수"]}
                rows={[
                  ["카카오 회원 번호", "카카오 로그인", "필수"],
                  ["카카오 닉네임", "카카오 로그인", "필수"],
                  ["저장한 일정, 찜한 일정", "직접 저장하거나 찜할 때", "기능을 쓸 때"],
                  ["대략적인 위치(약 1km 단위)", "「내 위치로」를 누를 때", "선택"],
                ]}
              />
              <p>닉네임은 데이터베이스에 저장하지 않고 로그인 쿠키에만 담아 화면에 보여 줘요. 로그아웃하면 사라져요.</p>
              <p>
                서비스를 쓰는 동안 서버에 접속 기록(IP 주소, 브라우저 종류, 접속 시각)이 자동으로 남을 수 있어요. 오류를 고치고 보안 문제를 막는 데만 써요.
              </p>
              <p>
                「내 위치로」를 누르면 휴대폰이 위치 권한을 물어요. 허용하면 위치를 소수 둘째 자리(약 1km)로 줄여서 출발지에서 갈 곳까지 거리를 재고 동네 이름을 찾는 데만 쓰고, 저장하지 않아요. 줄인 좌표는 화면 주소에 들어가 위 접속 기록에 남을 수 있어요. 누르지 않으면 위치를 받지 않아요.
              </p>
            </Section>

            <Section n={2}>
              <ul className="list-disc space-y-1 pl-5">
                <li>로그인 상태 유지와 본인 확인</li>
                <li>저장한 일정과 찜 목록 보여 주기, 공유 링크 만들기</li>
                <li>「내 위치로」를 고르면 출발지에서 갈 곳까지 거리 재기</li>
                <li>서비스 오류 확인과 부정 이용 방지</li>
              </ul>
              <p>위 목적 말고는 쓰지 않고, 광고나 마케팅에 쓰지 않아요.</p>
            </Section>

            <Section n={3}>
              <ul className="list-disc space-y-1 pl-5">
                <li>카카오 회원 번호, 저장한 일정, 찜: 탈퇴할 때까지 보관하고, 탈퇴하면 그 즉시 지워요.</li>
                <li>로그인 쿠키: 최대 7일. 로그아웃하면 바로 지워져요.</li>
                <li>위치: 저장하지 않아요. 접속 기록에 남은 줄인 좌표는 접속 기록과 함께 지워져요.</li>
                <li>접속 기록: 호스팅 업체(Vercel)의 기본 보관 기간이 지나면 자동으로 지워져요.</li>
              </ul>
              <p>법령에 따로 보관해야 하는 정보는 받지 않아요.</p>
            </Section>

            <Section n={4}>
              <p>앱이나 웹 어디서든 직접 탈퇴할 수 있어요.</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>카카오로 로그인해요.</li>
                <li>
                  <Link href="/account#delete" className="font-bold underline underline-offset-4">
                    내 계정 → 탈퇴하기
                  </Link>
                  로 가요. 화면 맨 아래 「계정 삭제」 링크로도 갈 수 있어요.
                </li>
                <li>지워지는 내용을 확인하고 「계정과 데이터 모두 삭제하기」를 눌러요.</li>
              </ol>
              <p>
                <b>바로 지워지는 것:</b> 카카오 회원 번호, 내가 저장한 일정(공유 링크 포함), 내 찜 목록, 다른 사람이 내 일정에 한 찜
              </p>
              <p>
                <b>남는 것:</b> 없어요. 접속 기록만 위 보관 기간 동안 남았다가 지워져요.
              </p>
              <p>
                카카오 쪽 연결까지 끊으려면 카카오계정 설정의 「연결된 서비스 관리」에서 「계획은 J가」를 지워 주세요. 로그인할 수 없어 탈퇴하지 못하는 경우에는{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline underline-offset-4">
                  {CONTACT_EMAIL}
                </a>
                로 알려 주시면 확인한 뒤 지워 드려요.
              </p>
            </Section>

            <Section n={5}>
              <p>서비스를 운영하려고 아래 업체에 일을 맡겨요. 개인정보를 다른 곳에 「제공」하지는 않아요.</p>
              <Table
                head={["업체", "맡기는 일", "나라"]}
                rows={[
                  ["Vercel Inc.", "웹사이트 호스팅, 접속 기록", "미국 (서버는 서울 리전)"],
                  ["Neon Inc.", "데이터베이스 보관 (카카오 회원 번호, 일정, 찜)", "싱가포르 (AWS 아시아 태평양 리전)"],
                  ["(주)카카오", "카카오 로그인 인증, 줄인 좌표로 동네 이름 찾기", "대한민국"],
                ]}
              />
              <p>
                카카오 회원 번호, 저장한 일정, 찜은 싱가포르에 있는 데이터베이스에 보관하고, 접속 기록은 미국 업체인 Vercel이 처리해요. 로그인하거나 일정을 저장할 때 네트워크를 통해 옮겨지고, 위 「보관과 삭제」 기간 동안 보관돼요. 원하지 않으면 로그인하지 않고 쓰거나 탈퇴하면 돼요.
              </p>
              <p>일정 소개 글은 OpenAI에 일정 내용(장소 이름, 날짜, 날씨)만 보내서 만들어요. 개인정보는 보내지 않아요.</p>
            </Section>

            <Section n={6}>
              <Table
                head={["쿠키", "용도", "기간"]}
                rows={[
                  ["ht_session", "로그인 상태 유지 (회원 번호, 닉네임)", "최대 7일"],
                  ["ht_oauth", "카카오 로그인 위조 방지", "10분"],
                ]}
              />
              <p>광고나 분석용 쿠키는 쓰지 않아요. 브라우저 설정에서 쿠키를 막으면 로그인 기능만 쓸 수 없어요.</p>
            </Section>

            <Section n={7}>
              <p>
                언제든 내 정보를 보거나 지울 수 있어요. 찜 목록은{" "}
                <Link href="/saved" className="underline underline-offset-4">
                  찜한 일정
                </Link>
                에서 보고 풀 수 있고, 모든 정보는 탈퇴로 지울 수 있어요. 그 밖의 요청은 아래 문의처로 보내 주세요. 10일 안에 답해 드려요.
              </p>
            </Section>

            <Section n={8}>
              <ul className="list-disc space-y-1 pl-5">
                <li>모든 통신은 HTTPS로 암호화해요.</li>
                <li>로그인 쿠키는 서명해서 위조할 수 없고, 자바스크립트로 읽을 수 없게(httpOnly) 해 두었어요.</li>
                <li>카카오 로그인 토큰은 회원 번호를 받는 데만 쓰고 저장하지 않아요.</li>
                <li>필요한 정보만 받아서, 지킬 정보 자체를 줄였어요.</li>
              </ul>
            </Section>

            <Section n={9}>
              <p>서비스는 만 14세 미만을 대상으로 하지 않아요. 만 14세 미만이라면 로그인하지 말아 주세요.</p>
            </Section>

            <Section n={10}>
              <p>
                개인정보 보호 책임자: 서비스 운영자
                <br />
                이메일:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline underline-offset-4">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="text-[15px] text-muted">
                개인정보 침해 신고나 상담이 필요하면 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118)나 개인정보분쟁조정위원회(kopico.go.kr, 1833-6972)에 문의할 수 있어요.
              </p>
            </Section>

            <Section n={11}>
              <p>내용이 바뀌면 시행 7일 전에 이 페이지에 알려 드려요.</p>
              <ul className="list-disc pl-5 text-[15px] text-muted">
                <li>{EFFECTIVE}: 「내 위치로」를 누를 때만 대략적인 위치(약 1km 단위)를 쓰고 저장하지 않는다는 내용을 더했어요.</li>
                <li>2026년 10월 28일: 카카오 닉네임을 필수로 받고, 로그인 쿠키 기한을 30일에서 7일로 줄였어요.</li>
                <li>2026년 10월 27일: 처음 만듦</li>
              </ul>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Summary({ tone, title, children }: { tone: string; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-3xl border-[2.5px] border-ink bg-surface p-4">
      <span aria-hidden className={`mt-1 size-3.5 shrink-0 rounded-full border-2 border-ink ${tone}`} />
      <div>
        <p className="font-display text-lg leading-tight">{title}</p>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">{children}</p>
      </div>
    </li>
  );
}

function Section({ n, children }: { n: number; children: ReactNode }) {
  const { id, title } = SECTIONS[n - 1];
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2 id={`${id}-title`} className="font-display text-[22px]">
        <span className="mr-2 text-muted tabular-nums">{n}</span>
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border-[2.5px] border-ink">
      <table className="w-full text-left text-[14px] sm:text-[15px]">
        <thead className="bg-cream">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 font-bold sm:px-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-ink/10 bg-surface">
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i} className="px-3 py-2.5 align-top [overflow-wrap:anywhere] sm:px-4">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
