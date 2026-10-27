import { describe, expect, it } from "vitest";
import { User, UserRepository } from "../domain/user";
import { deleteAccount } from "./delete-account";

class MemoryUsers implements UserRepository {
  constructor(public users: User[]) {}
  async findOrCreateByKakaoId(): Promise<User> {
    throw new Error("쓰지 않음");
  }
  async delete(id: string) {
    this.users = this.users.filter((u) => u.id !== id);
  }
}

describe("deleteAccount", () => {
  it("데이터를 먼저 지우고 계정을 지운다 — 다른 사람 계정은 그대로", async () => {
    const users = new MemoryUsers([{ id: "u1", kakaoId: 1 }, { id: "u2", kakaoId: 2 }]);
    const order: string[] = [];
    await deleteAccount(
      {
        userId: "u1",
        forgetData: async (id) => {
          order.push(`data:${id}`);
          expect(users.users.map((u) => u.id)).toContain("u1");
        },
      },
      users,
    );
    expect(order).toEqual(["data:u1"]);
    expect(users.users.map((u) => u.id)).toEqual(["u2"]);
  });

  it("데이터 지우기가 실패하면 계정은 남는다 — 다시 시도할 수 있게", async () => {
    const users = new MemoryUsers([{ id: "u1", kakaoId: 1 }]);
    await expect(
      deleteAccount({ userId: "u1", forgetData: async () => Promise.reject(new Error("DB")) }, users),
    ).rejects.toThrow();
    expect(users.users).toHaveLength(1);
  });
});
