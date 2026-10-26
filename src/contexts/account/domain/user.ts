/** 사용자(애그리거트 루트) — 카카오 회원 번호로만 알아본다 */
export type User = {
  readonly id: string;
  readonly kakaoId: number;
};

/** 포트 — 처음 로그인하면 만든다 */
export interface UserRepository {
  findOrCreateByKakaoId(kakaoId: number): Promise<User>;
}

/** 카카오가 알려 준 사람 — 닉네임은 선택 동의라 없을 수 있다 */
export type KakaoProfile = {
  readonly kakaoId: number;
  readonly nickname?: string;
};

/** 포트 — 카카오 인가 코드로 회원 번호(와 동의했으면 닉네임)를 받는다. 실패하면 undefined */
export interface KakaoAuth {
  profileFromCode(code: string, redirectUri: string): Promise<KakaoProfile | undefined>;
}

/** 화면에 쓰는 닉네임 — 앞뒤 공백을 빼고 20자까지. 비면 undefined */
export function displayNickname(nickname: string | undefined): string | undefined {
  const trimmed = nickname?.trim();
  return trimmed ? [...trimmed].slice(0, 20).join("") : undefined;
}
