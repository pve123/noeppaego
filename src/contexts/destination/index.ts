/**
 * destination 컨텍스트의 공개 API — 다른 컨텍스트와 화면(app/)은 이 파일만 import 한다.
 * 의존을 여기서 조립한다(조립 루트).
 */
import "server-only";
import { findDestinations as handle, type FindDestinations } from "./application/find-destinations";
import { KakaoDriveTimes } from "@/shared/kakao/kakao-mobility";
import { TourFestivalRepository } from "./infrastructure/tour-festival-repository";

const repository = new TourFestivalRepository();
const driveTimes = new KakaoDriveTimes();

export const findDestinations = (query: FindDestinations) => handle(query, repository, driveTimes);

export type { DestinationView, DestinationsView, FestivalView, LatLng } from "./application/find-destinations";
