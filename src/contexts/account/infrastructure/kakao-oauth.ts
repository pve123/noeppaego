import "server-only";
import { KakaoAuth, KakaoProfile } from "../domain/user";

const AUTHORIZE = "https://kauth.kakao.com/oauth/authorize";
const TOKEN = "https://kauth.kakao.com/oauth/token";
const ME = "https://kapi.kakao.com/v2/user/me";

/** 카카오 로그인 화면 주소 — 동의 항목은 콘솔 설정(닉네임 선택 동의)을 따른다 */
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

type KakaoMe = {
  id?: number;
  kakao_account?: { profile?: { nickname?: string } };
  properties?: { nickname?: string };
};

/**
 * 인가 코드 → 액세스 토큰 → 회원 번호·닉네임. 토큰은 이것만 받는 데 쓰고 저장하지 않는다.
 * 키·코드·토큰·닉네임은 로그에 남기지 않는다 — 상태 코드만.
 */
export class KakaoOAuth implements KakaoAuth {
  async profileFromCode(code: string, redirectUri: string): Promise<KakaoProfile | undefined> {
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
      const me = (await meRes.json()) as KakaoMe;
      if (typeof me.id !== "number") return undefined;
      return { kakaoId: me.id, nickname: me.kakao_account?.profile?.nickname ?? me.properties?.nickname };
    } catch (e) {
      console.warn(`[kakao:oauth] 연결 실패: ${(e as Error).name}`);
      return undefined;
    }
  }
}
