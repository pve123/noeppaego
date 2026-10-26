/**
 * itinerary 컨텍스트의 공개 API — 다른 컨텍스트와 화면(app/)은 이 파일만 import 한다.
 * 의존을 여기서 조립한다(조립 루트).
 */
import "server-only";
import { KakaoDriveTimes } from "@/shared/kakao/kakao-mobility";
import { describeItinerary as describe } from "./application/describe-itinerary";
import { planItinerary as handle, type ItineraryView, type PlanItinerary } from "./application/plan-itinerary";
import { randomId } from "@/shared/db/random-id";
import {
  findSavedItinerary as findSaved,
  listFavorites as listFavs,
  saveItinerary as save,
  toggleFavorite as toggle,
  type ItinerarySnapshot,
  type SaveItinerary,
} from "./application/saved-itineraries";
import { ClaudeTripWriter } from "./infrastructure/claude-trip-writer";
import { DrizzleSavedItineraryRepository } from "./infrastructure/drizzle-saved-itinerary-repository";
import { KmaWeatherOutlook } from "./infrastructure/kma-weather-outlook";
import { KakaoRestaurantFinder, TourRestaurantFinder } from "./infrastructure/restaurant-finders";
import { TourPlaceCatalog } from "./infrastructure/tour-place-catalog";

const catalog = new TourPlaceCatalog();
// 카카오 REST 키가 있으면 카카오 로컬(맛집이 훨씬 많다), 실패하거나 없으면 관광공사 음식점.
const restaurants = process.env.KAKAO_REST_API_KEY
  ? new KakaoRestaurantFinder(new TourRestaurantFinder())
  : new TourRestaurantFinder();

const driveTimes = new KakaoDriveTimes();

const writer = new ClaudeTripWriter();
const outlook = new KmaWeatherOutlook();

export const planItinerary = (query: PlanItinerary) => handle(query, catalog, restaurants, driveTimes, outlook);
/** 하루마다 AI 소개 글 — 못 쓰면 undefined */
export const describeItinerary = (plan: ItineraryView) => describe(plan, writer);

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

export type { DayView, ItineraryView, PlaceView, SlotView, WeatherView } from "./application/plan-itinerary";
export type { FavoriteView, SavedItineraryView } from "./application/saved-itineraries";
