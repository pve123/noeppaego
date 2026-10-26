import { displayNickname, KakaoAuth, UserRepository } from "../domain/user";

export type SignInWithKakao = {
  code: string;
  /** 인가 요청 때 쓴 것과 같아야 한다 */
  redirectUri: string;
};

/**
 * 카카오 로그인 마무리(Command) — 회원 번호로 사용자를 찾거나 만든다. 실패하면 undefined.
 * 닉네임은 DB 에 두지 않고 돌려주기만 한다(세션에만 담는다).
 */
export async function signInWithKakao(
  command: SignInWithKakao,
  kakao: KakaoAuth,
  users: UserRepository,
): Promise<{ userId: string; nickname?: string } | undefined> {
  const profile = await kakao.profileFromCode(command.code, command.redirectUri);
  if (!profile) return undefined;
  const user = await users.findOrCreateByKakaoId(profile.kakaoId);
  return { userId: user.id, nickname: displayNickname(profile.nickname) };
}
