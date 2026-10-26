/** 사용자(애그리거트 루트) — 카카오 회원 번호로만 알아본다 */
export type User = {
  readonly id: string;
  readonly kakaoId: number;
};

/** 포트 — 처음 로그인하면 만든다 */
export interface UserRepository {
  findOrCreateByKakaoId(kakaoId: number): Promise<User>;
}

/** 포트 — 카카오 인가 코드로 회원 번호를 받는다. 실패하면 undefined */
export interface KakaoAuth {
  kakaoIdFromCode(code: string, redirectUri: string): Promise<number | undefined>;
}
