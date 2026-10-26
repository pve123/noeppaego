/**
 * destination 컨텍스트의 공개 API — 다른 컨텍스트와 화면(app/)은 이 파일만 import 한다.
 * 의존을 여기서 조립한다(조립 루트).
 */
import "server-only";
import { findDestinations as handle, type FindDestinations } from "./application/find-destinations";
import { TourFestivalRepository } from "./infrastructure/tour-festival-repository";

const repository = new TourFestivalRepository();

export const findDestinations = (query: FindDestinations) => handle(query, repository);

export type { DestinationView, DestinationsView, FestivalView } from "./application/find-destinations";
