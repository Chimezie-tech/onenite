import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/layout/AuthGuard";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OneNite",
  description: "Meet amazing people near you 🌍❤️",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black">
      <head>
        {/* Load the Telegram Web App SDK before anything else */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}