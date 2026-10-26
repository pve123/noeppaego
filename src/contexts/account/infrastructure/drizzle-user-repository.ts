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
}
