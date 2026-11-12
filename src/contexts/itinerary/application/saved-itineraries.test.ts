import { describe, expect, it } from "vitest";
import { FavoriteEntry, MAX_SNAPSHOT_BYTES, SavedItinerary, SavedItineraryRepository } from "../domain/saved-itinerary";
import { findSavedItinerary, forgetItinerariesOf, ItinerarySnapshot, listFavorites, saveItinerary, snapshotOf, toggleFavorite } from "./saved-itineraries";

class MemoryRepository implements SavedItineraryRepository {
  items = new Map<string, SavedItinerary>();
  favs: { userId: string; itineraryId: string; at: number }[] = [];
  private clock = 0;
  async save(it: SavedItinerary) {
    this.items.set(it.id, { ...it, createdAt: new Date("2026-10-26T03:00:00Z") });
  }
  async find(id: string) {
    return this.items.get(id);
  }
  async addFavorite(userId: string, itineraryId: string) {
    if (!(await this.isFavorite(userId, itineraryId))) this.favs.push({ userId, itineraryId, at: ++this.clock });
  }
  async removeFavorite(userId: string, itineraryId: string) {
    this.favs = this.favs.filter((f) => !(f.userId === userId && f.itineraryId === itineraryId));
  }
  async isFavorite(userId: string, itineraryId: string) {
    return this.favs.some((f) => f.userId === userId && f.itineraryId === itineraryId);
  }
  async listFavorites(userId: string): Promise<FavoriteEntry[]> {
    return this.favs
      .filter((f) => f.userId === userId)
      .sort((a, b) => b.at - a.at)
      .map((f) => ({ itinerary: this.items.get(f.itineraryId)!, favoritedAt: new Date(f.at) }));
  }
  async deleteAllOf(userId: string) {
    const mine = new Set([...this.items.values()].filter((it) => it.ownerId === userId).map((it) => it.id));
    this.favs = this.favs.filter((f) => f.userId !== userId && !mine.has(f.itineraryId));
    for (const id of mine) this.items.delete(id);
  }
}

const snapshot = (regionName = "경기도 파주시"): ItinerarySnapshot => ({
  breakTitle: "성탄절",
  breakEnd: "2026-12-27",
  regionName,
  lengthLabel: "2박 3일",
  startLabel: "2026.12.25(금)",
  endLabel: "2026.12.27(일)",
});

let seq = 0;
const ids = () => `ID${String(++seq).padStart(8, "0")}`;
const save = (repo: MemoryRepository, ownerId = "u1", regionName?: string) =>
  saveItinerary({ ownerId, breakStart: "2026-12-25", regionCode: "41-480", picks: {}, snapshot: snapshot(regionName) }, repo, ids);

describe("일정 저장(Command)", () => {
  it("저장하면 저장한 사람의 찜에 들어간다", async () => {
    const repo = new MemoryRepository();
    const id = await save(repo);
    expect(await repo.isFavorite("u1", id)).toBe(true);
  });

  it("너무 큰 일정은 저장하지 않는다", async () => {
    const repo = new MemoryRepository();
    const huge = { ...snapshot(), breakTitle: "가".repeat(MAX_SNAPSHOT_BYTES) };
    await expect(
      saveItinerary({ ownerId: "u1", breakStart: "2026-12-25", regionCode: "41-480", picks: {}, snapshot: huge }, repo, ids),
    ).rejects.toThrow();
    expect(repo.items.size).toBe(0);
  });
});

describe("찜하기(Command)", () => {
  it("다른 사람이 저장한 일정을 찜하고 풀 수 있다", async () => {
    const repo = new MemoryRepository();
    const id = await save(repo, "u1");
    expect(await toggleFavorite({ userId: "u2", itineraryId: id, favorite: true }, repo)).toBe(true);
    expect(await repo.isFavorite("u2", id)).toBe(true);
    expect(await toggleFavorite({ userId: "u2", itineraryId: id, favorite: false }, repo)).toBe(false);
    expect(await repo.isFavorite("u2", id)).toBe(false);
  });

  it("없는 일정·형식이 틀린 id 는 찜하지 않는다", async () => {
    const repo = new MemoryRepository();
    expect(await toggleFavorite({ userId: "u1", itineraryId: "ID00000000", favorite: true }, repo)).toBe(false);
    expect(await toggleFavorite({ userId: "u1", itineraryId: "../etc", favorite: true }, repo)).toBe(false);
    expect(repo.favs).toHaveLength(0);
  });
});

describe("저장한 일정 보기(Query)", () => {
  it("보는 사람 기준으로 찜·내 일정 여부와 저장한 날(한국)을 붙인다", async () => {
    const repo = new MemoryRepository();
    const id = await save(repo, "u1");
    const mine = await findSavedItinerary({ id, viewerId: "u1" }, repo);
    expect(mine).toMatchObject({ mine: true, favorite: true, savedOn: "2026.10.26", breakTitle: "성탄절" });
    const guest = await findSavedItinerary({ id }, repo);
    expect(guest).toMatchObject({ mine: false, favorite: false });
  });

  it("저장한 것은 다시 짤 재료와 제목뿐이다 — 장소를 담지 않는다", async () => {
    const repo = new MemoryRepository();
    const id = await save(repo, "u1");
    expect(Object.keys(repo.items.get(id)!.snapshot).sort()).toEqual(
      ["breakEnd", "breakTitle", "endLabel", "lengthLabel", "regionName", "startLabel"].sort(),
    );
  });

  it("예전에 일정을 통째로 저장한 것은 제목만 꺼내고 끝날은 일정 날수로 어림한다", () => {
    const legacy = {
      breakTitle: "설날",
      plan: {
        regionName: "강원특별자치도 강릉시",
        customized: false,
        lengthLabel: "2박 3일",
        startLabel: "2027.02.06(토)",
        endLabel: "2027.02.08(월)",
        days: [{ dayNumber: 1 }, { dayNumber: 2 }, { dayNumber: 3 }],
      },
      summaries: ["카카오 가게 이름이 들어간 소개"],
      prefs: { pace: "relaxed" },
    };
    expect(snapshotOf(legacy, "2027-02-06")).toEqual({
      breakTitle: "설날",
      breakEnd: "2027-02-08",
      regionName: "강원특별자치도 강릉시",
      lengthLabel: "2박 3일",
      startLabel: "2027.02.06(토)",
      endLabel: "2027.02.08(월)",
      prefs: { pace: "relaxed" },
    });
  });

  it("형식이 틀린 id 는 찾지도 않는다", async () => {
    expect(await findSavedItinerary({ id: "x" }, new MemoryRepository())).toBeUndefined();
  });

  it("찜 목록은 최근 찜한 것부터, 제목은 지역과 기간", async () => {
    const repo = new MemoryRepository();
    await save(repo, "u1", "경기도 파주시");
    await save(repo, "u1", "부산광역시 해운대구");
    const list = await listFavorites("u1", repo);
    expect(list.map((f) => f.title)).toEqual(["부산광역시 해운대구 2박 3일", "경기도 파주시 2박 3일"]);
    expect(list[0].period).toBe("2026.12.25(금)부터 2026.12.27(일)까지");
  });
});

describe("탈퇴(Command)", () => {
  it("내가 저장한 일정과 내 찜, 남이 내 일정에 한 찜까지 지우고 남의 일정은 그대로 둔다", async () => {
    const repo = new MemoryRepository();
    const mine = await save(repo, "u1");
    const theirs = await save(repo, "u2");
    await toggleFavorite({ userId: "u1", itineraryId: theirs, favorite: true }, repo);
    await toggleFavorite({ userId: "u2", itineraryId: mine, favorite: true }, repo);

    await forgetItinerariesOf("u1", repo);

    expect(await repo.find(mine)).toBeUndefined();
    expect(await repo.find(theirs)).toBeDefined();
    expect(await listFavorites("u1", repo)).toEqual([]);
    expect((await listFavorites("u2", repo)).map((f) => f.id)).toEqual([theirs]);
  });
});
