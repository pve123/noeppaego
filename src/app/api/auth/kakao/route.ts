import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { kakaoAuthorizeUrl } from "@/contexts/account";
import { loginAvailable, safeNext } from "@/shared/auth/session";
import { randomId } from "@/shared/db/random-id";

/** 카카오 로그인 시작 — 위조 요청을 막는 state 를 쿠키에 두고 카카오 로그인 화면으로 보낸다 */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const redirectUri = `${request.nextUrl.origin}/api/auth/kakao/callback`;
  const state = randomId(24);
  const url = loginAvailable() ? kakaoAuthorizeUrl(state, redirectUri) : undefined;
  if (!url) return NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}login=unavailable`, request.nextUrl.origin));

  (await cookies()).set("ht_oauth", JSON.stringify({ state, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 10 * 60,
  });
  return NextResponse.redirect(url);
}
