import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaRegister from "./_components/PwaRegister";

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
  applicationName: "Fasheone Shoes",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fasheone",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
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
      <body className="min-h-full flex flex-col bg-[#0a0a0a]">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
