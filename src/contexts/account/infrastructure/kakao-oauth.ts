import "server-only";
import { KakaoAuth } from "../domain/user";

const AUTHORIZE = "https://kauth.kakao.com/oauth/authorize";
const TOKEN = "https://kauth.kakao.com/oauth/token";
const ME = "https://kapi.kakao.com/v2/user/me";

/** 카카오 로그인 화면 주소 — 동의 항목은 요청하지 않는다(회원 번호만 쓴다) */
export function kakaoAuthorizeUrl(state: string, redirectUri: string): string | undefined {
  const clientId = process.env.KAKAO_REST_API_KEY;
  if (!clientId) return undefined;
  const url = new URL(AUTHORIZE);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url.toString();
}

/**
 * 인가 코드 → 액세스 토큰 → 회원 번호. 토큰은 회원 번호를 받는 데만 쓰고 저장하지 않는다.
 * 키·코드·토큰은 로그에 남기지 않는다 — 상태 코드만.
 */
export class KakaoOAuth implements KakaoAuth {
  async kakaoIdFromCode(code: string, redirectUri: string): Promise<number | undefined> {
    const clientId = process.env.KAKAO_REST_API_KEY;
    if (!clientId) return undefined;

    const body = new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, redirect_uri: redirectUri, code });
    const secret = process.env.KAKAO_CLIENT_SECRET;
    if (secret) body.set("client_secret", secret);

    try {
      const tokenRes = await fetch(TOKEN, { method: "POST", body, signal: AbortSignal.timeout(5_000) });
      if (!tokenRes.ok) {
        console.warn(`[kakao:oauth] 토큰 응답 ${tokenRes.status}`);
        return undefined;
      }
      const { access_token: accessToken } = (await tokenRes.json()) as { access_token?: string };
      if (!accessToken) return undefined;

      const meRes = await fetch(ME, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(5_000) });
      if (!meRes.ok) {
        console.warn(`[kakao:oauth] 회원 정보 응답 ${meRes.status}`);
        return undefined;
      }
      const { id } = (await meRes.json()) as { id?: number };
      return typeof id === "number" ? id : undefined;
    } catch (e) {
      console.warn(`[kakao:oauth] 연결 실패: ${(e as Error).name}`);
      return undefined;
    }
  }
}
