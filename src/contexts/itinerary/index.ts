/**
 * itinerary 컨텍스트의 공개 API — 다른 컨텍스트와 화면(app/)은 이 파일만 import 한다.
 * 의존을 여기서 조립한다(조립 루트).
 */
import "server-only";
import { KakaoDriveTimes } from "@/shared/kakao/kakao-mobility";
import { describeItinerary as describe } from "./application/describe-itinerary";
import { planItinerary as handle, type ItineraryView, type PlanItinerary } from "./application/plan-itinerary";
import { ClaudeTripWriter } from "./infrastructure/claude-trip-writer";
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

export type { DayView, ItineraryView, PlaceView, SlotView, WeatherView } from "./application/plan-itinerary";
