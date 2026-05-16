import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://shoes.fasheone.com"),
  title: {
    default: "Fasheone Shoes — Ayakkabı markaları için AI görsel stüdyosu",
    template: "%s · Fasheone Shoes",
  },
  description:
    "Telefonla çektiğin ayakkabı fotoğrafını satışa hazır stüdyo görseline, modelin ayağında pozlara, sıfır tasarımlara ve e-ticaret metinlerine dönüştür. Türkçe, hızlı, ürününe sadık.",
  keywords: ["ayakkabı fotoğraf", "ürün görseli", "e-ticaret", "AI tasarım", "stüdyo çekimi", "Fasheone"],
  openGraph: {
    title: "Fasheone Shoes — Ayakkabı markaları için AI görsel stüdyosu",
    description:
      "Tek fotoğraftan satışa hazır görsel, çoklu poz, rötuş ve e-ticaret metni. Türkçe ve ürününe sadık.",
    url: "https://shoes.fasheone.com",
    siteName: "Fasheone Shoes",
    locale: "tr_TR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
