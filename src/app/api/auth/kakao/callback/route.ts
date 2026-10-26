import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { signInWithKakao } from "@/contexts/account";
import { safeNext, startSession } from "@/shared/auth/session";

/** 카카오 로그인 마무리 — state 가 맞을 때만 코드를 바꾸고 세션을 연다 */
export async function GET(request: NextRequest) {
  const jar = await cookies();
  const saved = parse(jar.get("ht_oauth")?.value);
  jar.delete({ name: "ht_oauth", path: "/api/auth" });

  const params = request.nextUrl.searchParams;
  const next = safeNext(saved?.next);
  const fail = () => NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}login=failed`, request.nextUrl.origin));

  const code = params.get("code");
  if (!saved || !code || params.get("state") !== saved.state) return fail();

  const result = await signInWithKakao({ code, redirectUri: `${request.nextUrl.origin}/api/auth/kakao/callback` });
  if (!result) return fail();

  await startSession(result.userId);
  return NextResponse.redirect(new URL(next, request.nextUrl.origin));
}

function parse(value: string | undefined): { state: string; next: string } | undefined {
  try {
    const v = JSON.parse(value ?? "");
    return typeof v?.state === "string" && typeof v?.next === "string" ? v : undefined;
  } catch {
    return undefined;
  }
}
