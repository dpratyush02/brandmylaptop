import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/components/currency/CurrencyProvider";
import { Analytics } from "@vercel/analytics/react";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005'),
  title: "BrandMyLaptop — Your Brand. On My Laptop.",
  description:
    "Bid for one of 10 advertising spots on my HP laptop. Live auction for 72 hours. Your logo goes live online while you're the highest bidder.",
  keywords: [
    "BrandMyLaptop",
    "laptop advertising",
    "sticker advertising",
    "startup sponsorship",
    "HP laptop auction",
    "72-hour auction",
  ],
  authors: [{ name: "BrandMyLaptop" }],
  creator: "BrandMyLaptop",
  openGraph: {
    title: "BrandMyLaptop — Your Brand. On My Laptop.",
    description:
      "10 physical ad spots on my HP laptop lid. 72-hour live auction. Your logo goes live online when you bid. Highest bidder gets the physical spot.",
    url: "https://brandmylaptop.space",
    siteName: "BrandMyLaptop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BrandMyLaptop — HP Laptop Advertising Auction",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BrandMyLaptop — Your Brand. On My Laptop.",
    description:
      "Bid for one of 10 advertising spots on my HP laptop. 72-hour live auction. Highest bidder gets the spot on my laptop.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${jetbrainsMono.variable} dark scroll-smooth`}>
      <body className="bg-black text-[#f3f3ee] font-sans antialiased min-h-screen">
        <CurrencyProvider>{children}</CurrencyProvider>
        <Analytics />
      </body>
    </html>
  );
}
