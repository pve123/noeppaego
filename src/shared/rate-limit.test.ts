import { describe, expect, it } from "vitest";
import { RateLimiter, clientIp } from "./rate-limit";

describe("RateLimiter", () => {
  it("창 하나에 limit 번까지 받고 그다음은 남은 초와 함께 막는다", () => {
    const limiter = new RateLimiter(2, 60_000);
    expect(limiter.take("a", 0)).toEqual({ ok: true });
    expect(limiter.take("a", 1_000)).toEqual({ ok: true });
    expect(limiter.take("a", 10_000)).toEqual({ ok: false, retryAfterSec: 50 });
  });

  it("창이 끝나면 다시 받는다", () => {
    const limiter = new RateLimiter(1, 60_000);
    limiter.take("a", 0);
    expect(limiter.take("a", 59_999).ok).toBe(false);
    expect(limiter.take("a", 60_000).ok).toBe(true);
  });

  it("키마다 따로 센다", () => {
    const limiter = new RateLimiter(1, 60_000);
    limiter.take("a", 0);
    expect(limiter.take("b", 0).ok).toBe(true);
  });

  it("기억하는 키가 maxKeys 를 넘지 않는다", () => {
    const limiter = new RateLimiter(1, 60_000, 2);
    limiter.take("a", 0);
    limiter.take("b", 0);
    limiter.take("c", 0);
    // 가장 오래된 a 를 버렸으니 a 는 새 창으로 받는다
    expect(limiter.take("a", 1).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("x-forwarded-for 의 첫 주소를 쓴다", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("헤더가 없으면 한 묶음으로 센다", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
