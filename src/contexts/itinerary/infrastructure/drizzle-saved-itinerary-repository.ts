import "server-only";
import { and, desc, eq } from "drizzle-orm";
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
  snapshot: row.snapshot,
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
      snapshot: { ...it.snapshot },
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
}
