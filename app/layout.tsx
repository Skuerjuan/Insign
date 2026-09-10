import type { Metadata } from "next";
import "@fontsource/geist/latin-100.css";
import "@fontsource/geist/latin-200.css";
import "@fontsource/geist/latin-300.css";
import "@fontsource/geist/latin-400.css";
import "@fontsource/geist/latin-500.css";
import "@fontsource/geist/latin-600.css";
import "@fontsource/geist/latin-700.css";
import "@fontsource/geist/latin-800.css";
import "@fontsource/geist/latin-900.css";
import "@fontsource/geist-mono/latin-100.css";
import "@fontsource/geist-mono/latin-200.css";
import "@fontsource/geist-mono/latin-300.css";
import "@fontsource/geist-mono/latin-400.css";
import "@fontsource/geist-mono/latin-500.css";
import "@fontsource/geist-mono/latin-600.css";
import "@fontsource/geist-mono/latin-700.css";
import "@fontsource/geist-mono/latin-800.css";
import "@fontsource/geist-mono/latin-900.css";
import "@fontsource/rubik/latin-900.css";
import "@fontsource/baloo-2/latin-400.css";
import "@fontsource/baloo-2/latin-500.css";
import "@fontsource/baloo-2/latin-600.css";
import "@fontsource/baloo-2/latin-700.css";
import "@fontsource/baloo-2/latin-800.css";
import "./globals.css";

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
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
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
