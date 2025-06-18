import "./globals.css";
import { Crimson_Text, Inter } from "next/font/google";

const bodyFont = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
});

const headingFont = Inter({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata = {
  title: "Ale Pouroullis",
  description: "Essays and thoughts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
