import { NextResponse, type NextRequest } from "next/server";
import { findParking } from "@/contexts/itinerary";
import { RateLimiter, tooManyRequests } from "@/shared/rate-limit";

/**
 * IP 하나가 1분에 부를 수 있는 수 — 주차 시트는 장소마다 한 번 열어서 사람이 쓰면 이만큼 닿지 않는다.
 * 통신사 공인 IP 하나를 여러 사람이 나눠 쓰는 것을 생각해 넉넉히 잡는다. 바깥 API 쿼터를 지키려는 것이다.
 */
const limiter = new RateLimiter(60, 60_000);

/** 우리나라 안 좌표만 — 아무 좌표로 카카오 검색을 대신 부르는 통로가 되지 않게 */
const inKorea = (lat: number, lng: number) => lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;

/** 장소 근처 주차장 — 일정 카드의 「주차」 시트를 열 때 부른다 */
export async function GET(request: NextRequest) {
  const blocked = tooManyRequests(limiter, request);
  if (blocked) return blocked;
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inKorea(lat, lng)) {
    return NextResponse.json({ error: "bad-coordinate" }, { status: 400 });
  }
  return NextResponse.json(await findParking({ lat, lng }));
}
