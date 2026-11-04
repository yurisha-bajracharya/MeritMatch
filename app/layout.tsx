import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeritMatch — Nepal's Merit-Based Hiring Platform",
  description:
    "Fair hiring through anonymous work-sample tasks. No résumé, no network — just your skills.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Devanagari:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
