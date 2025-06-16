import "./globals.css";
import { Crimson_Text } from "next/font/google";

const font = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
      <body className={font.className}>{children}</body>
    </html>
  );
}
