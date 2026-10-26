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

export const metadata: Metadata = {
  title: "연휴 여행 플래너",
  description: "공휴일과 주말을 이어 연차를 가장 적게 쓰고 길게 쉬는 날을 찾아 드려요.",
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
