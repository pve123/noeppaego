import { NextResponse, type NextRequest } from "next/server";
import { endSession, safeNext } from "@/shared/auth/session";

/** 로그아웃 — 폼 POST 로만(링크로 로그아웃되지 않게) */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  await endSession();
  return NextResponse.redirect(new URL(safeNext(String(form.get("next") ?? "/")), request.nextUrl.origin), 303);
}
