import { NextResponse, type NextRequest } from "next/server";
import { findFacilityParking } from "@/contexts/itinerary";

const PLACE_ID = /^tour:\d{1,12}$/;
const KINDS = ["sight", "culture", "lodging", "restaurant", "cafe", "festival"] as const;
type Kind = (typeof KINDS)[number];

/** 장소 자체 주차 안내(관광공사) — 일정 카드의 「주차」 시트를 열 때 부른다. 관광공사 장소만 받는다 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const kind = request.nextUrl.searchParams.get("kind") ?? "";
  if (!PLACE_ID.test(id) || !KINDS.includes(kind as Kind)) {
    return NextResponse.json({ error: "bad-place" }, { status: 400 });
  }
  return NextResponse.json(await findFacilityParking(id, kind as Kind));
}
