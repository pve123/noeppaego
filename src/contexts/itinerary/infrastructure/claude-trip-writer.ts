import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { cacheLife } from "next/cache";
import { DayOutline, TripWriter } from "../domain/trip-writer";

const MODEL = "claude-opus-5-5";

const SYSTEM = `여행 앱에서 하루 일정 위에 붙는 짧은 소개 글을 쓴다.

- 하루마다 2~3문장, 친근한 해요체로 쓴다.
- 주어진 장소 이름만 쓴다. 영업시간·가격·거리·평점처럼 주어지지 않은 사실은 지어내지 않는다.
- 그날의 흐름(어디서 시작해 무엇을 먹고 어디서 마무리하는지)과 분위기를 전한다.
- 축제가 있으면 그날의 하이라이트로 짚는다.
- 날씨(weather)가 있으면 한 번만 자연스럽게 짚는다. 비 소식이 있으면 실내 장소 덕분에 괜찮다고 안심시킨다. 날씨가 없으면 날씨 이야기는 하지 않는다.
- 줄표·쉼표·가운뎃점 같은 기호로 잇지 말고 「~하고」「~한 뒤」「그리고」 같은 말로 잇는다. 이모지는 쓰지 않는다. 문장은 마침표로 끝낸다.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dayNumber: { type: "integer" },
          summary: { type: "string" },
        },
        required: ["dayNumber", "summary"],
        additionalProperties: false,
      },
    },
  },
  required: ["days"],
  additionalProperties: false,
} as const;

/**
 * Claude 로 하루 소개 글을 쓴다. 같은 일정(지역·장소 목록)은 하루 캐시 — 입력이 실제 연휴 × 추천 지역으로
 * 정해져 있어, 주소를 마구 바꿔도 하루 호출 수가 그 조합 수를 넘지 않는다.
 * 실패는 던지지 않고 null(캐시 경계를 넘으면 에러 정보가 사라진다), 몇 분만 캐시한다.
 */
async function writeSummaries(regionName: string, outlineJson: string): Promise<string[] | null> {
  "use cache";
  if (!process.env.ANTHROPIC_API_KEY) {
    cacheLife("seconds");
    return null;
  }

  const client = new Anthropic({ timeout: 30_000, maxRetries: 1 });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // 안전 분류기가 거절하면 서버가 알맞은 모델로 다시 돌린다.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // 짧은 글쓰기라 깊게 생각할 일이 없다.
      output_config: { effort: "low", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: `지역: ${regionName}\n일정(JSON): ${outlineJson}` }],
    });

    if (response.stop_reason !== "end_turn") {
      console.warn(`[claude] 글쓰기 중단 (stop_reason=${response.stop_reason})`);
      cacheLife("minutes");
      return null;
    }
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const parsed = JSON.parse(text) as { days: { dayNumber: number; summary: string }[] };
    cacheLife("days");
    return [...parsed.days].sort((a, b) => a.dayNumber - b.dayNumber).map((d) => d.summary.trim());
  } catch (e) {
    // 키·본문은 남기지 않는다 — 종류와 상태 코드만.
    if (e instanceof Anthropic.RateLimitError) console.warn("[claude] 요청 한도 초과(429)");
    else if (e instanceof Anthropic.AuthenticationError) console.warn("[claude] 인증 실패(401) — ANTHROPIC_API_KEY 확인");
    else if (e instanceof Anthropic.APIConnectionError) console.warn("[claude] 연결 실패·시간 초과");
    else if (e instanceof Anthropic.APIError) console.warn(`[claude] API 오류 ${e.status}`);
    else console.warn(`[claude] 응답을 읽지 못했다: ${(e as Error).name}`);
    cacheLife("minutes");
    return null;
  }
}

export class ClaudeTripWriter implements TripWriter {
  async describe(regionName: string, days: readonly DayOutline[]): Promise<string[] | undefined> {
    return (await writeSummaries(regionName, JSON.stringify(days))) ?? undefined;
  }
}
