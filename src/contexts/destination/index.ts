/**
 * destination 컨텍스트의 공개 API — 다른 컨텍스트와 화면(app/)은 이 파일만 import 한다.
 * 의존을 여기서 조립한다(조립 루트).
 */
import "server-only";
import { findDestinations as handle, type FindDestinations } from "./application/find-destinations";
import { KakaoAreaNames } from "./infrastructure/kakao-area-names";
import { TourFestivalRepository } from "./infrastructure/tour-festival-repository";

const repository = new TourFestivalRepository();
const areas = new KakaoAreaNames();

export const findDestinations = (query: FindDestinations) => handle(query, repository, areas);

export type { DestinationView, DestinationsView, FestivalView, LatLng } from "./application/find-destinations";
export { reachPreferenceOf, type ReachPreference } from "./domain/destination-recommender";
