import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { TopNav } from "@/components/TopNav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Stock Seasonality Analyzer",
    template: "%s · Stock Seasonality Analyzer",
  },
  description:
    "Explore seasonal and cyclical patterns in stock prices, grouped by consumer-spending categories and correlated with holidays and festivals.",
  applicationName: "Stock Seasonality Analyzer",
  keywords: [
    "stock seasonality",
    "seasonal patterns",
    "consumer spending",
    "event-window returns",
    "stock market research",
    "holiday trading",
  ],
  openGraph: {
    type: "website",
    title: "Stock Seasonality Analyzer",
    description:
      "Seasonal patterns in consumer-spending stocks, grouped by category and correlated with holidays and festivals.",
    siteName: "Stock Seasonality Analyzer",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stock Seasonality Analyzer",
    description:
      "Seasonal patterns in consumer-spending stocks. Every percentage shows its sample size.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <TopNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
