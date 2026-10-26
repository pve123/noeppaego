import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Postgres 연결 하나 — 로컬은 docker, 운영은 Vercel Neon(DATABASE_URL).
 * 서버리스 함수가 다시 쓰일 때 연결을 늘리지 않게 전역에 두고, Neon 연결 풀(pgbouncer)과 맞게 prepare 를 끈다.
 */
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 이 없습니다");
  globalForDb.sql ??= postgres(url, { prepare: false, max: 3 });
  return drizzle(globalForDb.sql);
}
