import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
  Fraunces,
} from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

const plexDeva = IBM_Plex_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-deva",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MeritMatch",
  description: "Get hired for the work you can do, not the people you know.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E3A5F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plex.variable} ${plexDeva.variable} ${fraunces.variable}`}
    >
      <body className="min-h-dvh">
        <div className="mx-auto w-full max-w-md px-5 pb-16">{children}</div>
      </body>
    </html>
  );
}
