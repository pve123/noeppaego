import { NextResponse, type NextRequest } from "next/server";
import { findFacilityParking } from "@/contexts/itinerary";
import { RateLimiter, tooManyRequests } from "@/shared/rate-limit";

/**
 * IP 하나가 1분에 부를 수 있는 수 — 주차 시트는 장소마다 한 번 열어서 사람이 쓰면 이만큼 닿지 않는다.
 * 통신사 공인 IP 하나를 여러 사람이 나눠 쓰는 것을 생각해 넉넉히 잡는다. 바깥 API 쿼터를 지키려는 것이다.
 */
const limiter = new RateLimiter(60, 60_000);

const PLACE_ID = /^tour:\d{1,12}$/;
const KINDS = ["sight", "culture", "lodging", "restaurant", "cafe", "festival"] as const;
type Kind = (typeof KINDS)[number];

/** 장소 자체 주차 안내(관광공사) — 일정 카드의 「주차」 시트를 열 때 부른다. 관광공사 장소만 받는다 */
export async function GET(request: NextRequest) {
  const blocked = tooManyRequests(limiter, request);
  if (blocked) return blocked;
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const kind = request.nextUrl.searchParams.get("kind") ?? "";
  if (!PLACE_ID.test(id) || !KINDS.includes(kind as Kind)) {
    return NextResponse.json({ error: "bad-place" }, { status: 400 });
  }
  return NextResponse.json(await findFacilityParking(id, kind as Kind));
}
