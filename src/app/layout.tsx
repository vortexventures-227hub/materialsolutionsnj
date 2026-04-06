import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DavidChatWidget } from "@/components/david/DavidChatWidget";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: {
    default: "Material Solutions NJ | AI-Powered Forklift Sales",
    template: "%s | Material Solutions NJ",
  },
  description:
    "AI-powered equipment solutions in New Jersey. Every forklift AI-analyzed, every listing verified, every price transparent. Talk to David, our AI sales specialist.",
  keywords: [
    "forklifts",
    "used forklifts",
    "AI forklift analysis",
    "NJ",
    "New Jersey",
    "forklift sales",
    "warehouse equipment",
    "propane forklift",
    "electric forklift",
    "diesel forklift",
    "Toyota forklifts",
    "Hyster forklifts",
    "Yale forklifts",
    "Crown forklifts",
    "material handling",
  ],
  authors: [{ name: "Material Solutions NJ" }],
  openGraph: {
    title: "Material Solutions NJ | AI-Powered Forklift Sales",
    description:
      "AI-powered equipment solutions. Every forklift analyzed, every listing verified. Talk to David, our AI sales specialist.",
    type: "website",
    locale: "en_US",
    siteName: "Material Solutions NJ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Material Solutions NJ | AI-Powered Forklift Sales",
    description: "AI-powered equipment solutions. Every forklift analyzed, every listing verified.",
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
    <html lang="en" className={`${inter.variable} dark`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-bg-primary text-text-primary">
        <Header />
        <main className="min-h-screen pt-16 lg:pt-[72px]">
          {children}
        </main>
        <Footer />
        <DavidChatWidget />
      </body>
    </html>
  );
}
