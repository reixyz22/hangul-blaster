import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// There is no Korean webfont here. The game composes syllables on the fly, so
// its glyph set is most of the 11,172 modern blocks — far past what a subset
// can carry, and the full Noto Sans KR is ~450 KB of split chunks behind a
// render-blocking stylesheet. Every platform this runs on ships a Korean face
// already, so --font-ko (see globals.css) asks for those instead: nothing to
// download, and nothing missing.

export const metadata: Metadata = {
  title: "Hangul Blaster",
  description:
    "A typing shooter for the Korean alphabet. Meteors fall, you type them, your ship fires.",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
