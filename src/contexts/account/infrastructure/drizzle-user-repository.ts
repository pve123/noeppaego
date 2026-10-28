import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { randomId } from "@/shared/db/random-id";
import { users } from "@/shared/db/schema";
import { User, UserRepository } from "../domain/user";

export class DrizzleUserRepository implements UserRepository {
  async findOrCreateByKakaoId(kakaoId: number): Promise<User> {
    // 같은 사람이 동시에 두 번 로그인해도 하나만 생기게 — 있으면 그대로 두고 다시 읽는다
    await db().insert(users).values({ id: randomId(16), kakaoId }).onConflictDoNothing({ target: users.kakaoId });
    const [row] = await db().select().from(users).where(eq(users.kakaoId, kakaoId));
    return { id: row.id, kakaoId: row.kakaoId };
  }

  /** 탈퇴했으면 false — 다른 기기의 세션 쿠키는 탈퇴 뒤에도 서명이 맞다 */
  async exists(id: string): Promise<boolean> {
    const [row] = await db().select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    return Boolean(row);
  }

  async delete(id: string): Promise<void> {
    await db().delete(users).where(eq(users.id, id));
  }
}
