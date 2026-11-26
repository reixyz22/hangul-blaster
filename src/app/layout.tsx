import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Noto Sans KR, cut down to the 264 glyphs this game can paint — see
// scripts/subset-font.py. The full family ships as ~450 KB of split woff2
// chunks behind a render-blocking stylesheet; this is one 27 KB file.
const notoKR = localFont({
  src: "../fonts/noto-sans-kr-subset.woff2",
  variable: "--font-noto-kr",
  weight: "400 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hangul Blaster",
  description:
    "An arcade game for learning the Korean alphabet. Shoot down Hangul letters before they land.",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoKR.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
