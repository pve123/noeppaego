import { describe, expect, it } from "vitest";
import { KakaoAuth, KakaoProfile, User, UserRepository } from "../domain/user";
import { signInWithKakao } from "./sign-in-with-kakao";

const kakao = (profile: KakaoProfile | undefined): KakaoAuth => ({ profileFromCode: async () => profile });

class MemoryUsers implements UserRepository {
  users: User[] = [];
  async findOrCreateByKakaoId(kakaoId: number) {
    let user = this.users.find((u) => u.kakaoId === kakaoId);
    if (!user) this.users.push((user = { id: `u${this.users.length + 1}`, kakaoId }));
    return user;
  }
  async delete(id: string) {
    this.users = this.users.filter((u) => u.id !== id);
  }
}

const command = { code: "c", redirectUri: "http://localhost:3000/api/auth/kakao/callback" };

describe("signInWithKakao", () => {
  it("처음이면 사용자를 만들고 다음에는 같은 사용자", async () => {
    const users = new MemoryUsers();
    const first = await signInWithKakao(command, kakao({ kakaoId: 7 }), users);
    const again = await signInWithKakao(command, kakao({ kakaoId: 7 }), users);
    expect(first?.userId).toBe(again?.userId);
    expect(users.users).toHaveLength(1);
  });

  it("닉네임은 다듬어서 돌려주고 저장하지 않는다 — 동의 안 했으면 없다", async () => {
    const users = new MemoryUsers();
    expect((await signInWithKakao(command, kakao({ kakaoId: 1, nickname: "  여행가  " }), users))?.nickname).toBe("여행가");
    expect((await signInWithKakao(command, kakao({ kakaoId: 2 }), users))?.nickname).toBeUndefined();
    expect((await signInWithKakao(command, kakao({ kakaoId: 3, nickname: "가".repeat(30) }), users))?.nickname).toHaveLength(20);
    expect(JSON.stringify(users.users)).not.toContain("여행가");
  });

  it("카카오가 실패하면 로그인하지 않는다", async () => {
    expect(await signInWithKakao(command, kakao(undefined), new MemoryUsers())).toBeUndefined();
  });
});
