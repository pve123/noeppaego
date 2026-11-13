/**
 * 고정 창(fixed window) 요청 수 제한 — 키(IP)마다 창 하나에 limit 번까지 받는다.
 *
 * 서버 메모리에 있어서 서버 인스턴스마다 따로 센다. 여러 인스턴스를 오가면 그만큼 더 받으므로
 * 바깥 API 쿼터를 지키는 첫 번째 울타리로만 쓰고, 더 단단히 막으려면 호스트(Vercel Firewall)의 제한을 함께 건다.
 */
export class RateLimiter {
  private readonly hits = new Map<string, { start: number; count: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    /** 이보다 많은 키를 기억하면 끝난 창을 지운다 — 메모리가 끝없이 늘지 않게 */
    private readonly maxKeys = 10_000,
  ) {}

  /** 받아도 되면 true. 넘었으면 false 와 다시 받을 때까지 남은 초 */
  take(key: string, now: number): { ok: true } | { ok: false; retryAfterSec: number } {
    const hit = this.hits.get(key);
    if (!hit || now - hit.start >= this.windowMs) {
      if (this.hits.size >= this.maxKeys) this.prune(now);
      this.hits.set(key, { start: now, count: 1 });
      return { ok: true };
    }
    if (hit.count < this.limit) {
      hit.count += 1;
      return { ok: true };
    }
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((hit.start + this.windowMs - now) / 1000)) };
  }

  private prune(now: number): void {
    for (const [key, hit] of this.hits) if (now - hit.start >= this.windowMs) this.hits.delete(key);
    // 모두 아직 창 안이면 가장 오래된 것부터 버린다(Map 은 넣은 순서를 지킨다)
    for (const key of this.hits.keys()) {
      if (this.hits.size < this.maxKeys) break;
      this.hits.delete(key);
    }
  }
}

/**
 * 라우트 맨 앞에서 부른다 — 한도를 넘었으면 돌려줄 429 응답, 아니면 undefined.
 * 사용: `const blocked = tooManyRequests(limiter, request); if (blocked) return blocked;`
 */
export function tooManyRequests(limiter: RateLimiter, request: Request): Response | undefined {
  const allowed = limiter.take(clientIp(request.headers), Date.now());
  if (allowed.ok) return undefined;
  return Response.json({ error: "too-many-requests" }, { status: 429, headers: { "Retry-After": String(allowed.retryAfterSec) } });
}

/**
 * 요청한 쪽 IP — Vercel 은 `x-forwarded-for` 를 자기가 본 주소로 덮어써서 사용자가 꾸밀 수 없다.
 * 로컬처럼 헤더가 없으면 모두 한 묶음으로 센다.
 */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
