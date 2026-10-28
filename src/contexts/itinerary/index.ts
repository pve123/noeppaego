/**
 * itinerary 컨텍스트의 공개 API — 다른 컨텍스트와 화면(app/)은 이 파일만 import 한다.
 * 의존을 여기서 조립한다(조립 루트).
 */
import "server-only";
import { KakaoDriveTimes } from "@/shared/kakao/kakao-mobility";
import { Coordinate } from "@/shared/kernel/coordinate";
import { describeItinerary as describe } from "./application/describe-itinerary";
import { findFacilityParking as findFacility, findParking as findLots } from "./application/find-parking";
import type { PlaceKind } from "./domain/place";
import { planItinerary as handle, type ItineraryView, type PlanItinerary } from "./application/plan-itinerary";
import { randomId } from "@/shared/db/random-id";
import {
  findSavedItinerary as findSaved,
  forgetItinerariesOf as forget,
  listFavorites as listFavs,
  saveItinerary as save,
  toggleFavorite as toggle,
  type ItinerarySnapshot,
  type SaveItinerary,
} from "./application/saved-itineraries";
import { OpenAiTripWriter } from "./infrastructure/openai-trip-writer";
import { DrizzleSavedItineraryRepository } from "./infrastructure/drizzle-saved-itinerary-repository";
import { KmaWeatherOutlook } from "./infrastructure/kma-weather-outlook";
import { PreviewWeatherOutlook, weatherPreviewOf } from "./infrastructure/preview-weather-outlook";
import { KakaoParkingFinder } from "./infrastructure/kakao-parking-finder";
import { TourFacilityParking } from "./infrastructure/tour-facility-parking";
import { KakaoPlacePages } from "./infrastructure/kakao-place-pages";
import { TourPlaceIntros } from "./infrastructure/tour-place-intros";
import { KakaoRestaurantFinder, TourRestaurantFinder } from "./infrastructure/restaurant-finders";
import { TourPlaceCatalog } from "./infrastructure/tour-place-catalog";

const catalog = new TourPlaceCatalog();
// 카카오 REST 키가 있으면 카카오 로컬(맛집이 훨씬 많다), 실패하거나 없으면 관광공사 음식점.
const restaurants = process.env.KAKAO_REST_API_KEY
  ? new KakaoRestaurantFinder(new TourRestaurantFinder())
  : new TourRestaurantFinder();

const driveTimes = new KakaoDriveTimes();
const pages = new KakaoPlacePages();
const intros = new TourPlaceIntros();

const writer = new OpenAiTripWriter();
// 로컬에서 날씨 화면을 볼 때만 가짜 예보(WEATHER_PREVIEW=rain|mixed). Vercel(VERCEL=1)에서는 값이 있어도 진짜 예보.
const preview = process.env.VERCEL ? undefined : weatherPreviewOf(process.env.WEATHER_PREVIEW);
const outlook = preview ? new PreviewWeatherOutlook(preview) : new KmaWeatherOutlook();

export const planItinerary = (query: PlanItinerary) => handle(query, catalog, restaurants, driveTimes, outlook, pages, intros);
/** 하루마다 AI 소개 글 — 못 쓰면 undefined */
export const describeItinerary = (plan: ItineraryView) => describe(plan, writer);

const parking = new KakaoParkingFinder();
/** 장소 근처 주차장 — 일정 카드의 「주차」를 눌렀을 때만 부른다 */
export const findParking = (at: { lat: number; lng: number }) => findLots(new Coordinate(at.lat, at.lng), parking);
const facilityParking = new TourFacilityParking();
/** 장소 자체 주차 안내(관광공사) — 「주차」 시트를 열 때만 부른다 */
export const findFacilityParking = (placeId: string, kind: PlaceKind) => findFacility(placeId, kind, facilityParking);

const saved = new DrizzleSavedItineraryRepository();

/**
 * 일정 저장(Command) — 화면이 보낸 일정이 아니라 서버가 주소 값으로 다시 짠 일정을 저장한다(아무 내용이나 넣지 못하게).
 * 처음 일정이면 AI 소개도 같이 저장한다.
 */
export async function saveItinerary(
  command: Omit<SaveItinerary, "snapshot"> & { breakTitle: string; breakEnd: string; today: string },
): Promise<string | undefined> {
  const plan = await planItinerary({
    start: command.breakStart,
    end: command.breakEnd,
    regionCode: command.regionCode,
    today: command.today,
    picks: command.picks,
  });
  if (!plan) return undefined;
  const summaries = plan.customized ? undefined : await describeItinerary(plan);
  const snapshot: ItinerarySnapshot = { breakTitle: command.breakTitle, plan, summaries };
  return save({ ...command, snapshot }, saved, () => randomId(10));
}

export const findSavedItinerary = (query: { id: string; viewerId?: string }) => findSaved(query, saved);
export const listFavorites = (userId: string) => listFavs(userId, saved);
export const toggleFavorite = (command: { userId: string; itineraryId: string; favorite: boolean }) => toggle(command, saved);
/** 탈퇴 — 계정을 지우기 전에 부른다(일정이 사용자를 가리키는 외래키라) */
export const forgetItinerariesOf = (userId: string) => forget(userId, saved);

export type { DayView, ItineraryView, PlaceView, SlotView, WeatherView } from "./application/plan-itinerary";
export type { FacilityParkingView, ParkingView } from "./application/find-parking";
export type { FavoriteView, SavedItineraryView } from "./application/saved-itineraries";
