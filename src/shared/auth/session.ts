import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

/**
 * 로그인 세션 — 서명한 쿠키(httpOnly·Secure·SameSite=Lax) 하나. 안에는 사용자 id 만 둔다.
 * 서명 키는 AUTH_SECRET(32자 이상). 없으면 로그인을 막는다 — 약한 키로 돌지 않게.
 */
const COOKIE = "ht_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function key(): Uint8Array | undefined {
  const secret = process.env.AUTH_SECRET;
  return secret && secret.length >= 32 ? new TextEncoder().encode(secret) : undefined;
}

export const loginAvailable = () => Boolean(key() && process.env.KAKAO_REST_API_KEY);

export async function startSession(userId: string): Promise<void> {
  const k = key();
  if (!k) throw new Error("AUTH_SECRET 이 없거나 짧습니다");
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime(`${MAX_AGE_SECONDS}s`).sign(k);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** 지금 로그인한 사용자 id — 없거나 서명이 틀리거나 만료면 undefined */
export async function currentUserId(): Promise<string | undefined> {
  const k = key();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!k || !token) return undefined;
  try {
    const { payload } = await jwtVerify(token, k, { algorithms: ["HS256"] });
    return payload.sub;
  } catch {
    return undefined;
  }
}

/** 로그인 뒤 돌아갈 곳 — 우리 사이트 안의 경로만(다른 사이트로 보내는 주소는 버린다) */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}
