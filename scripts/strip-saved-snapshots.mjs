// 예전에 저장한 일정의 snapshot 에서 장소(카카오 가게 정보 포함)와 AI 소개 글을 지우고
// 다시 짤 재료와 제목만 남긴다. 새 모양은 src/contexts/itinerary/application/saved-itineraries.ts 의 snapshotOf 와 같다.
//
// 기본은 바꾸지 않고 몇 건을 바꿀지만 보여 준다. --apply 를 붙여야 한 트랜잭션으로 바꾼다.
//   node --env-file=.env.local scripts/strip-saved-snapshots.mjs           # 로컬 DB, 미리 보기
//   node --env-file=.env.local scripts/strip-saved-snapshots.mjs --apply   # 로컬 DB, 바꾸기
// 운영 DB 는 그 주소를 DATABASE_URL 로 넣고 돌린다. 되돌릴 수 없으니 미리 보기로 건수부터 본다.
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL 이 없습니다");
const apply = process.argv.includes("--apply");

const DAY_MS = 86_400_000;
/** date 칸은 드라이버에 따라 Date 로 온다 */
const isoOf = (d) => (typeof d === "string" ? d : d.toISOString().slice(0, 10));
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

/** 예전 모양 { breakTitle, plan, summaries?, prefs? } → 새 모양 */
function stripped(snapshot, breakStart) {
  const { breakTitle, plan, prefs } = snapshot;
  const next = {
    breakTitle,
    breakEnd: addDays(isoOf(breakStart), Math.max(plan.days?.length ?? 0, 1) - 1),
    regionName: plan.regionName,
    lengthLabel: plan.lengthLabel,
    startLabel: plan.startLabel,
    endLabel: plan.endLabel,
  };
  if (prefs) next.prefs = prefs;
  return next;
}

const sql = postgres(url, { prepare: false, max: 1 });
try {
  const host = new URL(url).host;
  const rows = await sql`select id, break_start, snapshot from saved_itineraries where snapshot ? 'plan'`;
  console.log(`DB ${host} — 예전 모양 snapshot ${rows.length}건`);
  if (rows.length > 0) console.log(`예: ${rows[0].id} 의 새 snapshot 키 → ${Object.keys(stripped(rows[0].snapshot, rows[0].break_start)).join(", ")}`);

  if (!apply) {
    console.log("미리 보기만 했다. 바꾸려면 --apply 를 붙인다.");
  } else if (rows.length > 0) {
    await sql.begin(async (tx) => {
      for (const row of rows) {
        await tx`update saved_itineraries set snapshot = ${tx.json(stripped(row.snapshot, row.break_start))} where id = ${row.id}`;
      }
    });
    console.log(`${rows.length}건을 바꿨다.`);
  }
} finally {
  await sql.end();
}
