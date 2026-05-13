import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import MobileBlock from "@/components/MobileBlock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// deployement comment

export const metadata: Metadata = {
  title: "Prepfree",
  description: "We Prep You Shine!",
  icons: {
    icon: "/favicon.webp",
    apple: "/favicon.webp",
  },
  openGraph: {
    title: "Prepfree",
    description: "We Prep You Shine!",
    images: [
      {
        url: "/favicon.webp",
        width: 512,
        height: 512,
        alt: "Prepfree Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Prepfree",
    description: "We Prep You Shine!",
    images: ["/favicon.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MobileBlock />
        {children}
      </body>
    </html>
  );
}
