import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/toaster-provider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartHR - AI-Powered Recruitment & Talent Platform",
  description:
    "Platform rekrutmen cerdas berbasis AI untuk pencarian talenta, screening CV otomatis, dan manajemen lowongan kerja.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white`}>
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
