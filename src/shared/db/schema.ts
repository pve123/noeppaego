import { bigint, date, index, jsonb, pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * DB 테이블 — 여러 컨텍스트가 같이 쓰는 인프라라 한곳에 둔다(테이블 사이 외래키 때문).
 * 각 컨텍스트는 자기 테이블만 저장소 구현에서 쓴다: users → account, saved_itineraries·favorites → itinerary.
 */

/** 사용자 — 카카오 회원 번호만 둔다(이름·이메일·프로필은 받지 않는다) */
export const users = pgTable("users", {
  id: varchar("id", { length: 16 }).primaryKey(),
  kakaoId: bigint("kakao_id", { mode: "number" }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 저장한 일정 — 그 순간의 일정을 통째로(snapshot) 둔다. 관광 정보가 바뀌어도 공유한 그대로 보인다. */
export const savedItineraries = pgTable("saved_itineraries", {
  id: varchar("id", { length: 12 }).primaryKey(),
  ownerId: varchar("owner_id", { length: 16 })
    .notNull()
    .references(() => users.id),
  breakStart: date("break_start").notNull(),
  regionCode: varchar("region_code", { length: 16 }).notNull(),
  /** 사용자가 바꾼 칸 — 「이 일정으로 다시 짜기」 주소를 만든다 */
  picks: jsonb("picks").$type<Record<string, string>>().notNull(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 찜 — 내가 저장한 일정과 공유받아 찜한 일정 */
export const favorites = pgTable(
  "favorites",
  {
    userId: varchar("user_id", { length: 16 })
      .notNull()
      .references(() => users.id),
    itineraryId: varchar("itinerary_id", { length: 12 })
      .notNull()
      .references(() => savedItineraries.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.itineraryId] }), index("favorites_user_created").on(t.userId, t.createdAt)],
);
