import "server-only";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { favorites, savedItineraries } from "@/shared/db/schema";
import { FavoriteEntry, SavedItinerary, SavedItineraryRepository } from "../domain/saved-itinerary";

type Row = typeof savedItineraries.$inferSelect;

const toDomain = (row: Row): SavedItinerary => ({
  id: row.id,
  ownerId: row.ownerId,
  breakStart: row.breakStart,
  regionCode: row.regionCode,
  picks: row.picks,
  // DB 칸 이름은 예전 그대로 snapshot 이다(이름만 바꾸려고 마이그레이션하지 않는다)
  recipe: row.snapshot,
  createdAt: row.createdAt,
});

export class DrizzleSavedItineraryRepository implements SavedItineraryRepository {
  async save(it: SavedItinerary): Promise<void> {
    await db().insert(savedItineraries).values({
      id: it.id,
      ownerId: it.ownerId,
      breakStart: it.breakStart,
      regionCode: it.regionCode,
      picks: { ...it.picks },
      snapshot: { ...it.recipe },
    });
  }

  async find(id: string): Promise<SavedItinerary | undefined> {
    const [row] = await db().select().from(savedItineraries).where(eq(savedItineraries.id, id));
    return row ? toDomain(row) : undefined;
  }

  async addFavorite(userId: string, itineraryId: string): Promise<void> {
    await db().insert(favorites).values({ userId, itineraryId }).onConflictDoNothing();
  }

  async removeFavorite(userId: string, itineraryId: string): Promise<void> {
    await db().delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.itineraryId, itineraryId)));
  }

  async isFavorite(userId: string, itineraryId: string): Promise<boolean> {
    const [row] = await db()
      .select({ id: favorites.itineraryId })
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.itineraryId, itineraryId)));
    return Boolean(row);
  }

  async listFavorites(userId: string): Promise<FavoriteEntry[]> {
    const rows = await db()
      .select({ it: savedItineraries, favoritedAt: favorites.createdAt })
      .from(favorites)
      .innerJoin(savedItineraries, eq(favorites.itineraryId, savedItineraries.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))
      .limit(100);
    return rows.map((r) => ({ itinerary: toDomain(r.it), favoritedAt: r.favoritedAt }));
  }

  async deleteAllOf(userId: string): Promise<void> {
    // 찜이 일정을 가리키는 외래키라 찜부터 — 중간에 실패하면 아무것도 지우지 않게 한 트랜잭션으로
    await db().transaction(async (tx) => {
      const mine = tx.select({ id: savedItineraries.id }).from(savedItineraries).where(eq(savedItineraries.ownerId, userId));
      await tx.delete(favorites).where(or(eq(favorites.userId, userId), inArray(favorites.itineraryId, mine)));
      await tx.delete(savedItineraries).where(eq(savedItineraries.ownerId, userId));
    });
  }
}
