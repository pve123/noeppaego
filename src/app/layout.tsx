import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Jua, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "./_components/service-worker";
import { InstallPrompt } from "./_components/install-prompt";
import { ScrollToTop } from "./_components/scroll-to-top";

// 한글 글꼴은 subset 이 커서 미리 받지 않는다(preload: false) — 쓰는 글자만 그때 받는다.
const jua = Jua({ weight: "400", subsets: ["latin"], preload: false, variable: "--font-jua" });
const noto = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-noto",
});

const DESCRIPTION = "공휴일과 주말을 이어서 연차는 적게 쓰고 오래 쉬는 날을 찾아 드려요. 갈 곳과 하루 일정도 짜 드려요.";

export const metadata: Metadata = {
  metadataBase: new URL("https://holiday-trip.vercel.app"),
  title: "계획은 J가",
  description: DESCRIPTION,
  openGraph: {
    title: "계획은 J가",
    siteName: "계획은 J가",
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
      <body className="min-h-full overflow-x-hidden">
        {children}
        <ServiceWorker />
        {/* 주소(usePathname)를 읽어서 — 감싸지 않으면 페이지를 미리 만들어 두지 못한다 */}
        <Suspense>
          <InstallPrompt />
          <ScrollToTop />
        </Suspense>
      </body>
    </html>
  );
}
