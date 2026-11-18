import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const visit = (path: string, ua?: string) =>
  proxy(new NextRequest(`https://noeppaego.com${path}`, { headers: ua === undefined ? {} : { "user-agent": ua } }));

const CHROME = "Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const SAMSUNG = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36";
const DAUM_APP = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 DaumApps/7.0";

describe("proxy", () => {
  it("사람은 일정 화면을 그대로 연다", () => {
    for (const ua of [CHROME, SAMSUNG, DAUM_APP]) expect(visit("/breaks/2026-12-25/41-480", ua).status).toBe(200);
  });

  it("로봇은 일정 화면과 조건 붙은 연휴 화면에서 돌려보낸다", () => {
    expect(visit("/breaks/2026-12-25/41-480", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)").status).toBe(403);
    expect(visit("/breaks/2026-12-25?from=seoul&reach=2h", "Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)").status).toBe(403);
    expect(visit("/breaks/2026-12-25/41-480", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2)").status).toBe(403);
  });

  it("이름 없이 오면 로봇으로 본다", () => {
    expect(visit("/breaks/2026-12-25/41-480").status).toBe(403);
  });

  it("조건 없는 연휴 화면은 로봇에게도 연다 — 검색에 나오는 화면", () => {
    expect(visit("/breaks/2026-12-25", "Mozilla/5.0 (compatible; Googlebot/2.1)").status).toBe(200);
  });
});
