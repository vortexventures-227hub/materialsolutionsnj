import type { LocalBusiness, Organization, WithContext } from 'schema-dts';
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
  metadataBase: new URL('https://www.materialsolutionsnj.com'),
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

const organizationJsonLd: WithContext<Organization> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Material Solutions Inc.',
  alternateName: 'Material Solutions NJ',
  url: 'https://www.materialsolutionsnj.com',
  email: 'info@materialsolutionsnj.com',
  telephone: '(973) 500-1010',
} as const;

const localBusinessJsonLd: WithContext<LocalBusiness> = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Material Solutions NJ',
  parentOrganization: {
    '@type': 'Organization',
    name: 'Material Solutions Inc.',
  },
  url: 'https://www.materialsolutionsnj.com',
  telephone: '(973) 500-1010',
  email: 'info@materialsolutionsnj.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '28C Industrial Drive',
    addressLocality: 'Hamilton',
    addressRegion: 'NJ',
    postalCode: '08691',
    addressCountry: 'US',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
  ],
} as const;

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
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
