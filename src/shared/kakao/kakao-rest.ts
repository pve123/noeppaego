import "server-only";

/** 카카오 REST 호출 결과 — 키가 없거나 응답·연결이 실패하면 ok:false(실패는 이미 warn 으로 남겼다) */
type KakaoGet<T> = { ok: true; data: T } | { ok: false };

/**
 * 카카오 REST(로컬·모빌리티) GET 공통 — 주소 만들기, 키(KAKAO_REST_API_KEY, 서버에서만), 5초 제한, 실패 로그.
 * 로그에는 라벨과 상태 코드만 남긴다(키·주소·좌표는 남기지 않는다). 캐시 기간은 부르는 쪽(`use cache`)이 정한다.
 */
export async function kakaoGet<T>(label: string, base: string, params: Record<string, string | number>): Promise<KakaoGet<T>> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return { ok: false };
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  try {
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(5_000) });
    if (!res.ok) {
      console.warn(`[${label}] 응답 ${res.status}`);
      return { ok: false };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    console.warn(`[${label}] 연결 실패: ${(e as Error).name}`);
    return { ok: false };
  }
}
