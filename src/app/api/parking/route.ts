import { NextResponse, type NextRequest } from "next/server";
import { findParking } from "@/contexts/itinerary";

/** 우리나라 안 좌표만 — 아무 좌표로 카카오 검색을 대신 부르는 통로가 되지 않게 */
const inKorea = (lat: number, lng: number) => lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;

/** 장소 근처 주차장 — 일정 카드의 「주차」 시트를 열 때 부른다 */
export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inKorea(lat, lng)) {
    return NextResponse.json({ error: "bad-coordinate" }, { status: 400 });
  }
  return NextResponse.json(await findParking({ lat, lng }));
}
