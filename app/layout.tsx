import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik, Baloo_2 } from "next/font/google";
import "./globals.css";

// Configuración nativa de fuentes
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-rubik",
});

const baloo2 = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo",
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
      lang="es"
      className={`h-full antialiased ${baloo2.className} ${geistSans.variable} ${geistMono.variable} ${rubik.variable} ${baloo2.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem("insign-theme");
                document.documentElement.dataset.theme = savedTheme === "oscuro" ? "dark" : "light";
              } catch (error) {
                document.documentElement.dataset.theme = "light";
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}