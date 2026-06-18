import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/components/system/AppProviders";
import { DemoModeBanner } from "@/components/system/DemoModeBanner";
import { PageTransition } from "@/components/system/PageTransition";
import { PWARegistration } from "@/components/system/PWARegistration";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Civic Copilot | Delhi",
  description:
    "AI-powered citizen complaint management and authority mission control for Delhi civic teams.",
  applicationName: "Civic Copilot",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CivicAI",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/civic-icon.svg",
  },
};

export const viewport = {
  themeColor: "#1B4FD8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} bg-[#F8FAFC] font-[family-name:var(--font-inter)] text-[#0F172A] antialiased`}
      >
        <AppProviders>
          <PageTransition>{children}</PageTransition>
        </AppProviders>
        <PWARegistration />
        <DemoModeBanner />
      </body>
    </html>
  );
}
