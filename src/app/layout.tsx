import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import DavidWidget from "@/components/david/DavidWidget";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#F97316",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Material Solutions NJ | Quality Used Forklifts & Warehouse Equipment",
    template: "%s | Material Solutions NJ",
  },
  description:
    "29+ years serving New Jersey with quality reconditioned forklifts, OSHA training, wire-guided systems, and warehouse racking. Transparent pricing. Expert service. Talk to David, our AI equipment specialist.",
  keywords: [
    "forklifts",
    "used forklifts",
    "reconditioned forklifts",
    "NJ",
    "New Jersey",
    "forklift sales",
    "OSHA training",
    "warehouse equipment",
    "reach trucks",
    "order pickers",
    "pallet jacks",
    "wire-guided systems",
    "warehouse racking",
    "Raymond forklifts",
    "Crown forklifts",
    "Toyota forklifts",
  ],
  authors: [{ name: "Material Solutions NJ" }],
  openGraph: {
    title: "Material Solutions NJ | Quality Used Forklifts & Warehouse Equipment",
    description:
      "29+ years serving NJ, PA & NYC metro with quality reconditioned forklifts and warehouse solutions. Talk to David, our AI equipment specialist.",
    type: "website",
    locale: "en_US",
    siteName: "Material Solutions NJ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Material Solutions NJ | Quality Used Forklifts",
    description: "29+ years of quality reconditioned forklifts and warehouse solutions.",
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
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased text-secondary-900 bg-white">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <DavidWidget />
      </body>
    </html>
  );
}
