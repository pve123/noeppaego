# 계획은 J가

공휴일과 주말을 이어 연차를 가장 적게 쓰고 오래 쉬는 날을 찾고, 그 연휴에 갈 곳과 하루 일정까지 짜 주는 웹 앱이다.

운영: https://holiday-trip.vercel.app

## 할 수 있는 것

1. 날짜를 고른다. 한 해의 연휴를 모아 보여 주고, 연차를 더 쓰면 얼마나 길어지는지도 알려 준다.
2. 갈 곳을 고른다. 출발지(서울·부산 등 8개 도시)에서 닿을 만한 거리 안에서 연휴와 겹치는 축제가 많은 지역부터 추천한다.
3. 일정을 본다. 관광지와 식당과 숙소를 가까운 순으로 이어 하루 일정을 짜고 지도에 동선을 그린다.
   - 칸마다 근처 다른 곳으로 바꿀 수 있다. 바꾼 결과는 주소(`?pick=`)에 남는다.
   - 출발 10일 안이면 기상청 예보를 붙인다. 비 오는 반나절에는 실내 장소를 고르고, 축제 칸은 그대로 둔다.
   - OpenAI 키가 있으면 하루마다 짧은 소개 글을 붙인다.
4. 카카오로 로그인하면 일정을 저장하고 링크로 공유하고 찜해 둘 수 있다.

## 스택

Next.js 16(App Router·Turbopack·`use cache`) · React 19 · Tailwind CSS 4 · Drizzle ORM + Postgres · Vitest · Vercel(서울 리전 `icn1`)

바깥 데이터는 세 곳에서 받는다.

- 공공데이터포털: 천문연 특일, 관광공사 국문 관광정보, 기상청 단기·중기예보
- 카카오: 지도, 로컬(맛집), 모빌리티 길찾기, 로그인
- OpenAI: 하루 소개 글(선택)

## 로컬에서 실행

Node 24 이상이 필요하다.

```bash
cp .env.example .env.local     # 아래 「환경변수」를 채운다
docker run -d --name holiday-trip-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=holiday_trip -p 54329:5432 postgres:17-alpine
npm install
npm run db:migrate             # .env.local 의 DATABASE_URL 에 스키마를 만든다
npm run dev                    # http://localhost:3000
```

DB 없이도 날짜, 갈 곳, 일정 화면은 뜬다. 로그인과 저장과 찜만 DB를 쓴다.

비 오는 날 화면은 실제 예보가 있어야 보인다. `.env.local` 에 `WEATHER_PREVIEW=mixed`(또는 `rain`)를 넣고 dev 서버를 다시 켜면 기상청 대신 가짜 날씨로 채운다. Vercel 에서는 이 값을 무시한다.

## 환경변수

로컬은 `.env.local`, 배포는 Vercel 프로젝트의 Environment Variables 에 넣는다. 키 값은 커밋하지 않는다(`.env*` 는 `.gitignore` 에 있다).

| 이름 | 필요할 때 | 쓰임 |
|---|---|---|
| `DATA_GO_KR_SERVICE_KEY` | 항상 | 공공데이터포털 일반 인증키. 「Decoding」 키를 넣는다(코드가 URL 인코딩한다). |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 항상 | 카카오맵 JavaScript 키. 브라우저에 공개되므로 카카오 콘솔에서 사이트 도메인을 제한한다. |
| `KAKAO_REST_API_KEY` | 선택 | 카카오 REST 키. 맛집 찾기와 차 이동 시간과 로그인에 쓴다. 없으면 맛집은 관광공사 음식점으로 찾고, 이동은 직선 거리로만 보여 주고, 로그인 버튼을 숨긴다. |
| `KAKAO_CLIENT_SECRET` | 로그인 | 카카오 콘솔 「보안 → Client Secret」. |
| `AUTH_SECRET` | 로그인 | 세션 쿠키 서명 키. 32자 이상 무작위(`openssl rand -base64 32`). 없으면 로그인 버튼을 숨긴다. |
| `DATABASE_URL` | 저장 | Postgres 주소. 운영은 Vercel Storage 의 Neon 이 넣어 준다. |
| `OPENAI_API_KEY` | 선택 | 하루 소개 글. 서버에서만 쓴다. OpenAI 대시보드에서 월 사용 한도를 걸어 둔다. |
| `WEATHER_PREVIEW` | 로컬 전용 | `rain` 또는 `mixed`. 위 「로컬에서 실행」 참고. |

카카오 로그인의 Redirect URI 는 `<사이트 주소>/api/auth/kakao/callback` 이다. 로컬 주소와 운영 주소를 둘 다 카카오 콘솔에 등록한다. 받는 정보는 회원 번호와 닉네임(선택 동의)뿐이다.

## 검사

```bash
npm run typecheck   # 라우트 타입 생성 + tsc
npm run lint        # ESLint(레이어 의존 규칙 포함)
npm test            # Vitest(도메인·유스케이스)
```

DB 스키마는 `src/shared/db/schema.ts` 에 있다. 바꾸면 `npm run db:generate` 로 `drizzle/` 에 마이그레이션을 만들고 `npm run db:migrate` 로 적용한다. 운영 DB(Neon)에 적용할 때는 그 주소를 `DATABASE_URL` 로 넣고 같은 명령을 돌린다.

## 구조

바운디드 컨텍스트마다 domain, application, infrastructure 레이어로 나눈다.

```
src/
  app/                    화면. 컨텍스트는 공개 API(index.ts)로만 부른다
    _components/          화면 조각(카드, 지도, 스켈레톤 등)
    actions.ts            서버 액션(일정 저장, 찜하기)
    api/auth/             카카오 로그인과 콜백, 로그아웃
  contexts/
    calendar/             공휴일과 연휴 계산
    destination/          출발지와 축제로 갈 곳 추천
    itinerary/            하루 일정 짜기, 날씨, AI 소개, 일정 저장·공유·찜
    account/              카카오 로그인 사용자
      (컨텍스트마다 같은 모양)
      index.ts            공개 API이자 조립 루트(포트에 구현을 꽂는다)
      domain/             순수 규칙. 프레임워크와 바깥 레이어를 모른다
      application/        유스케이스. 읽기는 직렬화할 수 있는 View 로 돌려준다
      infrastructure/     포트 구현(공공데이터, 카카오, OpenAI, Drizzle)
  shared/
    kernel/               공유 커널. 좌표, 여행 기간, 날짜 표기, 한국어 조사
    public-data/          공공데이터포털 호출 공통(인증키, 거절 코드, 실패를 값으로)
    tour-api/ kma/ kakao/ 관광공사, 기상청, 카카오모빌리티 클라이언트
    db/ auth/             Drizzle 클라이언트와 스키마, 세션 쿠키
```

- 의존은 `app → contexts/<x>/index → application → domain ← infrastructure` 한 방향이다. `eslint.config.mjs` 의 `no-restricted-imports` 가 거꾸로 가는 import 를 막는다.
- 컨텍스트끼리는 서로 import 하지 않는다. 화면이 calendar 의 연휴 날짜를 destination 과 itinerary 에 넘긴다.
- CQRS: 로그인, 일정 저장, 찜하기만 쓰기(Command)이고 나머지는 읽기(Query)다. 저장할 때는 화면이 보낸 일정을 믿지 않고, 서버가 주소 값으로 다시 짠 일정을 그 순간 그대로(snapshot) 남긴다.

## 지키는 것

- 인증키는 서버에서만 쓴다. 공공데이터 URL 에는 키가 들어가므로 URL 과 에러 메시지를 로그에 남기지 않는다.
- `use cache` 함수는 실패를 던지지 않고 값으로 돌려준다. 던진 에러는 캐시 경계를 넘으면서 종류와 메시지를 잃는다.
- 바깥 API 가 실패해도 화면은 뜬다. 그 정보만 빠진다.
- 날짜는 `2026.12.25(금)` 처럼 쓴다. 화면 문구는 해요체로 쓰고 줄표·쉼표·가운뎃점 대신 조사로 잇는다(`shared/kernel/korean`).
