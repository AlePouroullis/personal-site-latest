import { Metadata } from "next";
import "./globals.css";
import { Crimson_Text, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { baseUrl } from "./sitemap";

const bodyFont = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
});

const headingFont = Inter({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Alé Pouroullis - Software Engineer & Writer",
    template: "%s | Alé Pouroullis",
  },
  description:
    "Personal website of Alé Pouroullis - software engineer, product builder, and occasional writer on career, ambition, and philosophy.",
  themeColor: "#fafafa",
  openGraph: {
    title: "Alé Pouroullis - Software Engineer & Writer",
    description:
      "Personal website of Alé Pouroullis - software engineer, product builder, and occasional writer on career, ambition, and philosophy.",
    url: baseUrl,
    siteName: "Alé Pouroullis",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <div className="min-h-screen">
          <div className="max-w-2xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
            {children}
          </div>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
