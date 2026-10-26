import { KakaoAuth, UserRepository } from "../domain/user";

export type SignInWithKakao = {
  code: string;
  /** 인가 요청 때 쓴 것과 같아야 한다 */
  redirectUri: string;
};

/** 카카오 로그인 마무리(Command) — 회원 번호로 사용자를 찾거나 만든다. 실패하면 undefined */
export async function signInWithKakao(
  command: SignInWithKakao,
  kakao: KakaoAuth,
  users: UserRepository,
): Promise<{ userId: string } | undefined> {
  const kakaoId = await kakao.kakaoIdFromCode(command.code, command.redirectUri);
  if (kakaoId === undefined) return undefined;
  const user = await users.findOrCreateByKakaoId(kakaoId);
  return { userId: user.id };
}
