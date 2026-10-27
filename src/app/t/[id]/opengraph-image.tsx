import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { findSavedItinerary } from "@/contexts/itinerary";
import { rangeText } from "@/shared/kernel/korean";

/**
 * 공유 링크 미리보기 이미지 — 카톡에 보냈을 때 어떤 일정인지 한눈에 보이게. 색·테두리는 사이트와 같다.
 * 글꼴은 그림에 쓰는 글자만 Google Fonts 에서 잘라 받는다(한글 글꼴 전체는 수 MB).
 * 일정을 못 찾거나 글꼴을 못 받으면 사이트 기본 미리보기(og.png)를 대신 보낸다.
 */
export const alt = "연휴 여행 플래너에서 저장한 일정";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#22223B";
/** 저장한 일정은 고치지 않는다(지우기만) — 미리보기도 하루 동안 그대로 써도 된다 */
const CACHE = "public, max-age=86400";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = await findSavedItinerary({ id }).catch(() => undefined);
  if (!view) return fallback();

  const { plan } = view;
  const places = plan.days
    .flatMap((d) => d.slots)
    .flatMap((s) => (s.place ? [s.place.title] : []))
    .filter((t, i, all) => all.indexOf(t) === i)
    .slice(0, 3)
    .map((t) => ([...t].length > 13 ? `${[...t].slice(0, 12).join("")}…` : t));
  const chip = `${view.breakTitle} 연휴`;
  const period = rangeText(plan.startLabel, plan.endLabel);
  const brand = "연휴 여행 플래너";
  const regionSize = [...plan.regionName].length > 8 ? 76 : 92;

  const font = await loadJua([chip, plan.regionName, plan.lengthLabel, period, brand, ...places, "…"].join(""));
  if (!font) return fallback();

  const icon = await readFile(join(process.cwd(), "src/app/icon.svg"), "utf8");
  const iconSrc = `data:image/svg+xml;base64,${Buffer.from(icon).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#FFFBEA", color: INK, fontFamily: "Jua" }}>
        {/* 오른쪽 노란 해와 웃는 핀 — 사이트 히어로와 같은 그림 */}
        <div
          style={{
            position: "absolute",
            right: -90,
            top: 70,
            width: 520,
            height: 520,
            borderRadius: 9999,
            // 아이콘 배경(icon.svg #ffd54d)과 같은 노랑 — 핀 뒤에 사각형이 비치지 않게
            background: "#FFD54D",
            border: `6px solid ${INK}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={iconSrc} alt="" width={240} height={240} style={{ marginRight: 90, borderRadius: 56 }} />
        </div>
        <div style={{ position: "absolute", right: 380, top: 52, width: 54, height: 54, borderRadius: 9999, background: "#3CCFB4", border: `5px solid ${INK}` }} />

        <div style={{ display: "flex", flexDirection: "column", padding: "64px 72px", width: 800 }}>
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                padding: "10px 26px",
                borderRadius: 9999,
                background: "#3CCFB4",
                border: `5px solid ${INK}`,
                fontSize: 34,
                transform: "rotate(-2deg)",
              }}
            >
              {chip}
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 30, fontSize: regionSize, lineHeight: 1.1 }}>{plan.regionName}</div>
          <div style={{ display: "flex", marginTop: 10 }}>
            <div style={{ display: "flex", background: "#FFD84D", borderRadius: 20, padding: "0 16px", fontSize: 92, lineHeight: 1.15 }}>{plan.lengthLabel}</div>
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 32, color: "#4A4A68" }}>{period}</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
            {places.map((p) => (
              <div key={p} style={{ display: "flex", padding: "8px 20px", borderRadius: 9999, background: "#FFFFFF", border: `4px solid ${INK}`, fontSize: 26 }}>
                {p}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", left: 72, bottom: 48, display: "flex", alignItems: "center", gap: 14, fontSize: 30 }}>
          <img src={iconSrc} alt="" width={48} height={48} style={{ borderRadius: 12 }} />
          {brand}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Jua", data: font, style: "normal", weight: 400 }], headers: { "Cache-Control": CACHE } },
  );
}

/** 쓰는 글자만 담은 Jua — Google Fonts 가 user-agent 없이 부르면 TTF 주소를 준다(ImageResponse 는 woff2 를 못 읽는다) */
async function loadJua(text: string): Promise<ArrayBuffer | undefined> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Jua&text=${encodeURIComponent(text)}`, { signal: AbortSignal.timeout(4_000) })
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return undefined;
    const res = await fetch(url, { signal: AbortSignal.timeout(4_000) });
    return res.ok ? await res.arrayBuffer() : undefined;
  } catch (e) {
    console.warn(`[og] 글꼴을 받지 못했다: ${(e as Error).name}`);
    return undefined;
  }
}

async function fallback(): Promise<Response> {
  const png = await readFile(join(process.cwd(), "public/og.png"));
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=600" } });
}
