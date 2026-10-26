# 연휴 여행 플래너

공휴일과 주말을 이어서, 연차를 가장 적게 쓰고 길게 쉬는 날을 찾아 준다. (1차: 날짜 추천)

## 실행

```bash
cp .env.example .env.local   # DATA_GO_KR_SERVICE_KEY 에 공공데이터포털 Decoding 키
npm install
npm run dev
```

검사: `npm run typecheck` · `npm run lint`(레이어 규칙 포함) · `npm test`

## 구조 — 바운디드 컨텍스트 + 레이어

```
src/
  app/                          화면(프레젠테이션). 컨텍스트는 공개 API(index.ts)로만 쓴다
  contexts/
    calendar/                   공휴일·연휴 컨텍스트
      index.ts                  공개 API + 조립 루트(포트에 구현을 꽂는다)
      domain/                   순수 — 프레임워크·바깥 레이어를 모른다
        calendar-date.ts          값 객체
        holiday-calendar.ts       애그리거트 루트(한 해의 쉬는 날)
        long-break.ts             연휴·쉬는 방법
        long-break-planner.ts     도메인 서비스(연휴 계산)
        holiday-calendar-repository.ts  포트
      application/              유스케이스. 읽기는 쿼리 → 읽기 모델(직렬화 가능한 View)
        find-long-breaks.ts
      infrastructure/           바깥 세계 — 공공데이터포털 클라이언트·포트 구현·캐시
    destination/                갈 만한 곳 컨텍스트 — 연휴와 겹치는 축제(관광공사 KorService2)로 지역 추천
      domain/                   Coordinate·TravelWindow(값 객체), Festival·포트, 추천(도메인 서비스)
      application/              find-destinations 쿼리 → 읽기 모델
      infrastructure/           관광공사 클라이언트·포트 구현
  shared/public-data/           공공데이터포털 호출 공통(인증키·거절 코드·실패를 값으로)
```

- 의존은 `app → contexts/<x>/index → application → domain ← infrastructure` 한 방향. `eslint.config.mjs` 의 `no-restricted-imports` 가 막는다.
- CQRS: 1차는 읽기뿐이라 쿼리만 있다. 쓰기(즐겨찾기·일정 저장)가 생기면 `application/` 에 커맨드를 둔다.
- 컨텍스트끼리는 서로 import 하지 않는다. 화면이 calendar 의 연휴 날짜를 destination 에 넘긴다.
- 다음 컨텍스트 후보: `itinerary`(하루별 일정) · `weather`(예보 반영).

## 규칙

- 인증키는 서버에서만 쓴다. URL 에 키가 들어가므로 URL·에러 메시지를 로그에 남기지 않는다.
- `use cache` 함수는 실패를 던지지 않고 값으로 돌려준다 — 던진 에러는 캐시 경계를 넘으며 정보를 잃는다.
- Vercel 함수 리전은 서울(`vercel.json` 의 `icn1`).
