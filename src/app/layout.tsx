import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/david/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Material Solutions NJ | Quality Used Forklifts & Equipment",
  description: "27+ years serving New Jersey with quality forklifts, OSHA training, wire-guided systems, and warehouse racking. Transparent pricing. Expert advice.",
  keywords: "forklifts, used forklifts, NJ, New Jersey, forklift sales, OSHA training, warehouse equipment",
  openGraph: {
    title: "Material Solutions NJ | Quality Used Forklifts & Equipment",
    description: "27+ years serving New Jersey with quality forklifts and warehouse solutions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
