import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";
import AuthGuard from "@/components/layout/AuthGuard";
import NavGate from "@/components/layout/NavGate";
import HelpFab from "@/components/support/HelpFab";
import BanScreen from "@/components/auth/BanScreen";
import { useUserStore } from "@/store/useUserStore";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OneNite",
  description: "Meet amazing people near you 🌍❤️",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useUserStore();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider>
          {profile?.is_banned ? <BanScreen /> : children}
          <AuthGuard>{children}</AuthGuard>
          <HelpFab />
          <NavGate />
        </ThemeProvider>
      </body>
    </html>
  );
}