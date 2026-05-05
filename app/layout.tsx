import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Connito SN102 — Live Leaderboard",
  description: "Real-time leaderboard for Bittensor SN102 (Connito / Mycelia).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-ink min-h-screen antialiased">
        <div className="max-w-6xl mx-auto px-6 py-10">{children}</div>
      </body>
    </html>
  );
}
