import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Rubik,
  Baloo_2,
} from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rubikOne = Rubik({
  variable: "--font-rubik-one",
  subsets: ["latin"],
  weight: "900",
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InSign",
  description: "Aprendé Lengua de Señas con InSign!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        ${rubikOne.variable}
        ${baloo.variable}
        h-full antialiased
      `}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
