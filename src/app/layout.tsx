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
    default: "Material Solutions NJ | Forklift Sales & Equipment",
    template: "%s | Material Solutions NJ",
  },
  description:
    "Current inventory, equipment sales, and buyer support for New Jersey warehouses. Talk to David for equipment questions or contact the team directly.",
  keywords: [
    "forklifts",
    "used forklifts",
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
    title: "Material Solutions NJ | Forklift Sales & Equipment",
    description:
      "Current inventory, equipment sales, and buyer support for New Jersey warehouses. Talk to David for equipment questions or contact the team directly.",
    type: "website",
    locale: "en_US",
    siteName: "Material Solutions NJ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Material Solutions NJ | Forklift Sales & Equipment",
    description:
      "Current inventory, equipment sales, and buyer support for New Jersey warehouses. Talk to David for equipment questions or contact the team directly.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
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
