import type { Metadata, Viewport } from "next";
import { Jua, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// 한글 글꼴은 subset 이 커서 미리 받지 않는다(preload: false) — 쓰는 글자만 그때 받는다.
const jua = Jua({ weight: "400", subsets: ["latin"], preload: false, variable: "--font-jua" });
const noto = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-noto",
});

const DESCRIPTION = "공휴일과 주말을 이어 연차를 가장 적게 쓰고 길게 쉬는 날을 찾고, 갈 곳과 하루 일정까지 짜 드려요.";

export const metadata: Metadata = {
  metadataBase: new URL("https://holiday-trip.vercel.app"),
  title: "연휴 여행 플래너",
  description: DESCRIPTION,
  openGraph: {
    title: "연휴 여행 플래너",
    description: DESCRIPTION,
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "언제 떠나면 가장 길게 쉴까?" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: "#fffbea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${jua.variable} ${noto.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-hidden">{children}</body>
    </html>
  );
}
