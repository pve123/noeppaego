"use server";

import { redirect } from "next/navigation";
import { deleteAccount } from "@/contexts/account";
import { CalendarDate, findLongBreak } from "@/contexts/calendar";
import { forgetItinerariesOf, saveItinerary, toggleFavorite } from "@/contexts/itinerary";
import { currentUserId, endSession } from "@/shared/auth/session";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REGION_CODE = /^\d+(-\d+)?$/;
const PICK_KEY = /^\d{4}-\d{2}-\d{2}-(?:morning|lunch|afternoon|dinner)$/;
const PICK_ID = /^[\w:.-]{1,80}$/;

const loginFirst = (back: string) => redirect(`/api/auth/kakao?next=${encodeURIComponent(back)}`);

/** 일정 저장하고 공유하기 — 로그인한 사람만. 저장하면 공유 페이지로 간다 */
export async function saveItineraryAction(form: FormData): Promise<void> {
  const start = String(form.get("start") ?? "");
  const region = String(form.get("region") ?? "");
  const back = String(form.get("back") ?? "/");
  if (!ISO_DATE.test(start) || !REGION_CODE.test(region)) redirect("/");

  const userId = await currentUserId();
  if (!userId) loginFirst(back);

  const picks: Record<string, string> = {};
  for (const [k, v] of Object.entries(parseJson(form.get("picks")))) {
    if (PICK_KEY.test(k) && typeof v === "string" && PICK_ID.test(v)) picks[k] = v;
  }

  const today = CalendarDate.todayIn("Asia/Seoul", new Date());
  const longBreak = await findLongBreak({ start: CalendarDate.of(start), today });
  if (!longBreak) redirect("/");

  const id = await saveItinerary({
    ownerId: userId!,
    breakStart: longBreak.base.startIso,
    breakEnd: longBreak.base.endIso,
    breakTitle: longBreak.title,
    regionCode: region,
    picks,
    today: today.iso,
  });
  redirect(id ? `/t/${id}?saved=1` : back);
}

/** 찜하기·찜 풀기 — 로그인한 사람만 */
export async function toggleFavoriteAction(form: FormData): Promise<void> {
  const itineraryId = String(form.get("id") ?? "");
  const back = String(form.get("back") ?? `/t/${itineraryId}`);
  const userId = await currentUserId();
  if (!userId) loginFirst(back);
  await toggleFavorite({ userId: userId!, itineraryId, favorite: form.get("favorite") === "1" });
  redirect(back.startsWith("/") && !back.startsWith("//") ? back : "/");
}

/**
 * 탈퇴 — 로그인한 본인만, 화면에서 「이해했어요」를 체크했을 때만. 다 지우면 세션도 끝내고 첫 화면으로.
 * 실패하면 계정은 남고(데이터부터 지운다) 다시 시도하라고 알린다.
 */
export async function deleteAccountAction(form: FormData): Promise<void> {
  const userId = await currentUserId();
  if (!userId) loginFirst("/account");
  if (form.get("confirm") !== "yes") redirect("/account");

  try {
    await deleteAccount({ userId: userId!, forgetData: forgetItinerariesOf });
  } catch (e) {
    console.warn(`[account:delete] 실패: ${(e as Error).name}`);
    redirect("/account?delete=failed");
  }
  await endSession();
  redirect("/?account=deleted");
}

function parseJson(value: FormDataEntryValue | null): Record<string, unknown> {
  try {
    const v = JSON.parse(String(value ?? "{}"));
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
