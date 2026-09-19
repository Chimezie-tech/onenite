import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";
import AuthGuard from "@/components/layout/AuthGuard";
import NavGate from "@/components/layout/NavGate";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OneNite",
  description: "Meet amazing people near you 🌍❤️",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider>
          <AuthGuard>{children}</AuthGuard>
          <NavGate />
        </ThemeProvider>
      </body>
    </html>
  );
}