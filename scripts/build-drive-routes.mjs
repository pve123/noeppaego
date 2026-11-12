// 출발 도시 → 전국 시·군·구 차 경로(걸리는 시간과 도로 모양)를 미리 계산해 JSON 으로 저장한다.
// 화면은 이 표만 읽어 실행 중에는 길찾기를 부르지 않는다. 도로는 잘 안 바뀌어 1년에 한 번쯤 다시 돌린다.
//
// 데이터는 오픈스트리트맵(OSM, ODbL)만 쓴다 — 저장·재사용이 허용되고 화면에 출처를 밝힌다.
// 카카오 길찾기·주소 검색 결과는 저장하면 안 되므로 쓰지 않는다.
//
// 준비(한 번): 한국 지도와 OSRM 경로 서버를 이 컴퓨터에 띄운다 — 외부 길찾기 API 를 부르지 않는다.
//   curl -LO https://download.geofabrik.de/asia/south-korea-latest.osm.pbf
//   IMG=ghcr.io/project-osrm/osrm-backend:v5.27.1
//   docker run --rm -v "$PWD:/data" $IMG osrm-extract -p /opt/car.lua /data/south-korea-latest.osm.pbf
//   docker run --rm -v "$PWD:/data" $IMG osrm-partition /data/south-korea-latest.osrm
//   docker run --rm -v "$PWD:/data" $IMG osrm-customize /data/south-korea-latest.osrm
//   docker run -d --rm --name osrm-korea -p 127.0.0.1:5001:5000 -v "$PWD:/data" $IMG osrm-routed --algorithm mld /data/south-korea-latest.osrm
//
// 실행:
//   node --env-file=.env.local scripts/build-drive-routes.mjs regions     # 시·군·구 목록(관광공사)과 대표 좌표(OSM 지명 검색, 1초에 한 번)
//   node scripts/build-drive-routes.mjs routes all                         # 모든 출발 도시(로컬 OSRM)
//   node scripts/build-drive-routes.mjs routes seoul                       # 출발 도시 하나
//
// 이미 저장한 경로는 건너뛰어 끊겨도 이어서 돌릴 수 있다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "src/contexts/destination/infrastructure/drive-routes";
const REGIONS = join(OUT, "regions.json");
const OSRM = process.env.OSRM_URL ?? "http://127.0.0.1:5001";
/** OSM 지명 검색 사용 정책 — 1초에 한 번, 누가 부르는지 밝힌다 */
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_PAUSE_MS = 1100;
const USER_AGENT = "noeppaego-route-builder (https://noeppaego.vercel.app)";
/** 이보다 가까운 곳은 추천에서 빠지므로(MIN_DISTANCE_KM) 계산하지 않는다 */
const SKIP_KM = 20;
/** 배·비행기로 가는 곳 — 차 경로가 없다 */
const ISLANDS = new Set(["50-110", "50-130", "47-940"]);
/** 도로 모양을 줄이는 허용 오차(도, 약 300m) — 전국 지도에서 보기에는 충분하다 */
const SIMPLIFY_DEG = 0.003;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 출발 도시: origin.ts 를 읽어 같은 목록을 쓴다 ──────────────────
function origins() {
  const source = readFileSync("src/contexts/destination/domain/origin.ts", "utf8");
  return [...source.matchAll(/\{ id: "([a-z]+)", name: "([^"]+)", at: new Coordinate\(([\d.]+), ([\d.]+)\) \}/g)].map(
    ([, id, name, lat, lng]) => ({ id, name, lat: Number(lat), lng: Number(lng) }),
  );
}

// ── 시·군·구 목록(관광공사 법정동 코드)과 대표 좌표(OSM 지명 검색) ──
async function buildRegions() {
  if (!process.env.DATA_GO_KR_SERVICE_KEY) throw new Error("키가 없어요 — --env-file=.env.local 로 돌려 주세요");
  const url = new URL("https://apis.data.go.kr/B551011/KorService2/ldongCode2");
  const params = { serviceKey: process.env.DATA_GO_KR_SERVICE_KEY, MobileOS: "ETC", MobileApp: "holidayTrip", _type: "json", lDongListYn: "Y", numOfRows: "1000", pageNo: "1" };
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const items = (await (await fetch(url)).json()).response.body.items.item;

  const regions = existsSync(REGIONS) ? JSON.parse(readFileSync(REGIONS, "utf8")) : {};
  for (const item of items) {
    // 세종처럼 시·군·구가 없는 곳은 시·도 코드 하나(tour-api 의 regionOf 와 같은 규칙)
    const single = item.lDongRegnCd === item.lDongSignguCd;
    const code = single ? item.lDongRegnCd : `${item.lDongRegnCd}-${item.lDongSignguCd}`;
    if (code in regions) continue;
    const name = single ? item.lDongRegnNm : `${item.lDongRegnNm} ${item.lDongSignguNm}`;
    const at = await geocode(item.lDongRegnNm, single ? "" : item.lDongSignguNm);
    if (!at) {
      console.warn(`좌표 없음: ${code} ${name}`);
      continue;
    }
    regions[code] = { name, ...at };
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(REGIONS, JSON.stringify(regions) + "\n");
  console.log(`시·군·구 ${Object.keys(regions).length}곳 저장`);
}

/** 2026년에 합친 「전남광주통합특별시」는 OSM 에 옛 이름으로 남아 있을 수 있어 옛 시·도 이름으로도 찾아본다 */
const OLD_REGION_NAMES = { 전남광주통합특별시: ["광주광역시", "전라남도"] };

async function geocode(regionName, districtName) {
  const regionNames = [regionName, ...(OLD_REGION_NAMES[regionName] ?? [])];
  for (const r of regionNames) {
    const url = new URL(NOMINATIM);
    const params = { q: `${r} ${districtName}`.trim(), format: "jsonv2", countrycodes: "kr", limit: "3", "accept-language": "ko" };
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    await sleep(NOMINATIM_PAUSE_MS);
    if (!res.ok) continue;
    const hit = (await res.json()).find((d) => d.category === "boundary" && d.type === "administrative");
    if (hit) return { lat: round(Number(hit.lat)), lng: round(Number(hit.lon)) };
  }
  return undefined;
}

// ── 경로: 로컬 OSRM(OSM 도로) — 막히지 않을 때 기준 ─────────────────
async function route(from, to) {
  const url = `${OSRM}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (body.code === "NoRoute") return null; // 길 없음 — 「모름」으로 저장해 다시 계산하지 않는다
  if (!res.ok || body.code !== "Ok") throw new Error(`OSRM 응답 ${res.status} ${body.code ?? ""} — 경로 서버를 띄웠는지 확인해 주세요`);
  const found = body.routes[0];
  const points = found.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  return { minutes: Math.round(found.duration / 60), path: simplify(points, SIMPLIFY_DEG).map(([lat, lng]) => [round(lat), round(lng)]) };
}

async function buildRoutes(which) {
  if (!existsSync(REGIONS)) throw new Error("regions.json 이 없어요 — 먼저 regions 를 돌려 주세요");
  const regions = JSON.parse(readFileSync(REGIONS, "utf8"));
  const list = origins().filter((o) => which === "all" || o.id === which);
  if (list.length === 0) throw new Error(`모르는 출발 도시: ${which}`);

  for (const origin of list) {
    const file = join(OUT, `${origin.id}.json`);
    const saved = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
    let added = 0;
    for (const [code, region] of Object.entries(regions)) {
      if (code in saved || ISLANDS.has(code) || km(origin, region) < SKIP_KM) continue;
      saved[code] = await route(origin, region);
      added++;
    }
    writeFileSync(file, JSON.stringify(saved) + "\n");
    console.log(`${origin.name}: 새로 ${added}곳, 저장 ${Object.keys(saved).length}곳`);
  }
}

// ── 계산 도구 ─────────────────────────────────────────────
const round = (n) => Math.round(n * 10_000) / 10_000;

function km(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** 더글러스-포커 — 모양을 지키며 점을 줄인다 */
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let farthest = -1;
    let max = tolerance;
    for (let i = start + 1; i < end; i++) {
      const d = distanceToSegment(points[i], points[start], points[end]);
      if (d > max) [max, farthest] = [d, i];
    }
    if (farthest > 0) {
      keep[farthest] = 1;
      stack.push([start, farthest], [farthest, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function distanceToSegment([y, x], [y1, x1], [y2, x2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = dx || dy ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

// ── 실행 ──────────────────────────────────────────────────
const [task, arg] = process.argv.slice(2);
if (task === "regions") await buildRegions();
else if (task === "routes") await buildRoutes(arg ?? "all");
else console.log("사용법: regions | routes <출발 도시 id | all>");
